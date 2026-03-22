import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Layout, Text, Button, Spinner, useTheme, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius } from '../../theme';
import apiClient from '../../services/api/client';
import { useAppSelector } from '../../redux/hooks';
import { UserRole } from '../../types';

// Guided enrollment steps with instructions and direction arrows
const ENROLLMENT_STEPS = [
  { label: 'Look Straight', instruction: 'Face the camera directly', arrow: null },
  { label: 'Turn Left', instruction: 'Slowly turn your head to the left', arrow: '←' },
  { label: 'Turn Right', instruction: 'Slowly turn your head to the right', arrow: '→' },
  { label: 'Tilt Up', instruction: 'Tilt your chin slightly upward', arrow: '↑' },
  { label: 'Tilt Down', instruction: 'Tilt your chin slightly downward', arrow: '↓' },
];

export const FaceRegistrationScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'danger' | 'basic'>('basic');
  const cameraRef = useRef<CameraView>(null);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((state) => state.auth.user);

  // Student list state
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<IndexPath>(new IndexPath(0));
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Multi-angle enrollment state
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]); // URIs for thumbnails
  const [capturedBuffers, setCapturedBuffers] = useState<{ uri: string; name: string; type: string }[]>([]);
  const photosRef = useRef<string[]>([]);
  const buffersRef = useRef<{ uri: string; name: string; type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [enrollmentDone, setEnrollmentDone] = useState(false);

  // Countdown timer for auto-capture
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchStudents();
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, []);

  // Pulse animation for guide circle when countdown is active
  useEffect(() => {
    if (countdown !== null) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [countdown]);

  const fetchStudents = async () => {
    if (user?.role === UserRole.STUDENT) {
      setStudents([user]);
      setIsLoadingStudents(false);
      return;
    }

    try {
      const response = await apiClient.get('/users?role=student');
      if (response.data.success) {
        setStudents(response.data.data.users || response.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load students', e);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <Layout style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ textAlign: 'center', marginBottom: spacing.md }}>
          Camera permission is needed for face enrollment.
        </Text>
        <Button onPress={requestPermission}>Grant Permission</Button>
      </Layout>
    );
  }

  const startCountdownCapture = () => {
    if (isProcessing || !cameraRef.current) return;
    setCountdown(3);
    let count = 3;

    const tick = () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        countdownRef.current = setTimeout(tick, 1000);
      } else {
        setCountdown(null);
        captureCurrentAngle();
      }
    };
    countdownRef.current = setTimeout(tick, 1000);
  };

  const captureCurrentAngle = async () => {
    if (!cameraRef.current) return;
    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) throw new Error('Failed to capture image');

      // Use refs to avoid stale React state in sequential captures
      const newPhotos = [...photosRef.current, photo.uri];
      const newBuffers = [
        ...buffersRef.current,
        { uri: photo.uri, name: `angle_${currentStep}.jpg`, type: 'image/jpeg' },
      ];
      photosRef.current = newPhotos;
      buffersRef.current = newBuffers;
      setCapturedPhotos(newPhotos);
      setCapturedBuffers(newBuffers);

      const nextStep = currentStep + 1;
      if (nextStep < ENROLLMENT_STEPS.length) {
        setCurrentStep(nextStep);
        setStatusMessage(`Captured! Now: ${ENROLLMENT_STEPS[nextStep].label}`);
        setStatusType('basic');
      } else {
        // All angles captured — upload
        setStatusMessage('All angles captured! Uploading...');
        setStatusType('basic');
        await uploadEnrollment(newBuffers);
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Capture failed, try again');
      setStatusType('danger');
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadEnrollment = async (buffers: { uri: string; name: string; type: string }[]) => {
    if (students.length === 0) return;
    const selectedStudent = students[selectedIndex.row];
    setIsUploading(true);

    try {
      const formData = new FormData();
      buffers.forEach((buf) => {
        formData.append('images', { uri: buf.uri, name: buf.name, type: buf.type } as any);
      });

      const studentId = selectedStudent._id || selectedStudent.id;
      const response = await apiClient.post(`/attendance/enroll/${studentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 min timeout for large multi-image upload
      });

      if (response.data.success) {
        const { anglesEnrolled, totalAngles, warnings } = response.data.data;
        setStatusMessage(`Enrolled ${anglesEnrolled} angle(s)! Total: ${totalAngles}.${warnings ? ` Warnings: ${warnings.join(', ')}` : ''}`);
        setStatusType('success');
        setEnrollmentDone(true);
      }
    } catch (error: any) {
      const errMessage = error.response?.data?.error?.message || (error.message === 'Network Error' ? 'Network error — check your connection and try again' : error.message) || 'Enrollment failed';
      setStatusMessage(errMessage);
      setStatusType('danger');
    } finally {
      setIsUploading(false);
    }
  };

  const resetEnrollment = () => {
    setCurrentStep(0);
    setCapturedPhotos([]);
    setCapturedBuffers([]);
    photosRef.current = [];
    buffersRef.current = [];
    setStatusMessage(null);
    setStatusType('basic');
    setEnrollmentDone(false);
    setCountdown(null);
    if (countdownRef.current) clearTimeout(countdownRef.current);
  };

  const displayValue = students.length > 0
    ? `${students[selectedIndex.row]?.name} (${students[selectedIndex.row]?.email})`
    : 'No students found';

  const step = ENROLLMENT_STEPS[currentStep];
  const borderColor = countdown !== null
    ? theme['color-warning-400']
    : isProcessing
    ? theme['color-primary-400']
    : theme['color-success-400'];

  return (
    <Layout style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: theme['color-success-500'] }]}>
        <Text category="h5" style={{ color: 'white', fontWeight: 'bold', flex: 1 }}>
          Face Enrollment
        </Text>
        <Button size="tiny" appearance="ghost" status="control" onPress={() => navigation.goBack()}>
          Cancel
        </Button>
      </View>

      {/* Camera with guide overlay */}
      <CameraView style={styles.camera} facing="front" ref={cameraRef}>
        <View style={styles.overlay}>
          {/* Step instruction */}
          {!enrollmentDone && (
            <View style={[styles.instructionBanner, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={styles.stepLabel}>{step.label}</Text>
              {step.arrow && <Text style={styles.stepArrow}>{step.arrow}</Text>}
              <Text style={styles.stepInstruction}>{step.instruction}</Text>
            </View>
          )}

          {/* Guide oval */}
          <Animated.View
            style={[
              styles.guideCircle,
              { borderColor },
              { transform: [{ scale: pulseAnim }] },
            ]}
          />

          {/* Countdown overlay */}
          {countdown !== null && (
            <Text style={styles.countdownText}>{countdown}</Text>
          )}

          {/* Step progress dots */}
          <View style={styles.progressDots}>
            {ENROLLMENT_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i < capturedPhotos.length
                      ? theme['color-success-400']
                      : i === currentStep
                      ? theme['color-warning-400']
                      : 'rgba(255,255,255,0.4)',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </CameraView>

      {/* Footer controls */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md }]}>
        {/* Captured thumbnails */}
        {capturedPhotos.length > 0 && (
          <View style={styles.thumbnailRow}>
            {capturedPhotos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.thumbnail} />
            ))}
          </View>
        )}

        {/* Student selector */}
        {user?.role !== UserRole.STUDENT && (
          <Text category="s1" style={{ marginBottom: spacing.sm }}>Select Student:</Text>
        )}
        {isLoadingStudents ? (
          <Spinner />
        ) : (
          <Select
            selectedIndex={selectedIndex}
            value={displayValue}
            onSelect={(index: any) => setSelectedIndex(index)}
            style={{ marginBottom: spacing.md }}
            disabled={students.length === 0 || capturedPhotos.length > 0 || user?.role === UserRole.STUDENT}
          >
            {students.map((student, idx) => (
              <SelectItem key={idx} title={`${student.name} (${student.email})`} />
            ))}
          </Select>
        )}

        {/* Status message */}
        {statusMessage && (
          <Text status={statusType} style={{ textAlign: 'center', marginBottom: spacing.md }}>
            {statusMessage}
          </Text>
        )}

        {/* Action buttons */}
        {enrollmentDone ? (
          <View style={{ gap: spacing.sm }}>
            <Button size="large" status="success" onPress={resetEnrollment}>
              {user?.role === UserRole.STUDENT ? 'Enroll Again' : 'Enroll Another Student'}
            </Button>
            <Button size="large" appearance="outline" onPress={() => navigation.goBack()}>
              Done
            </Button>
          </View>
        ) : isUploading ? (
          <View style={{ alignItems: 'center', padding: spacing.md }}>
            <Spinner size="large" status="success" />
            <Text style={{ marginTop: spacing.sm }}>Uploading face data...</Text>
          </View>
        ) : (
          <Button
            size="giant"
            status="success"
            onPress={countdown !== null ? undefined : startCountdownCapture}
            disabled={isProcessing || students.length === 0 || countdown !== null}
            style={styles.captureButton}
          >
            {countdown !== null
              ? `Capturing in ${countdown}...`
              : isProcessing
              ? 'Capturing...'
              : `Capture Angle ${currentStep + 1} of ${ENROLLMENT_STEPS.length}`}
          </Button>
        )}
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionBanner: {
    position: 'absolute',
    top: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  stepLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepArrow: {
    color: 'yellow',
    fontSize: 32,
    fontWeight: 'bold',
  },
  stepInstruction: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  guideCircle: {
    width: 250,
    height: 330,
    borderWidth: 3,
    borderRadius: 150,
    borderStyle: 'dashed',
  },
  countdownText: {
    position: 'absolute',
    color: 'white',
    fontSize: 72,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  progressDots: {
    position: 'absolute',
    bottom: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    elevation: 5,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  captureButton: {
    borderRadius: borderRadius.lg,
  },
});
