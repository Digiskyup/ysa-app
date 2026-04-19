import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Layout, Text, Button, Spinner, useTheme, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius } from '../../theme';
import apiClient from '../../services/api/client';
import { useAppSelector } from '../../redux/hooks';
import { UserRole } from '../../types';
import { AnimatedFaceHint, FaceHintStep } from '../../components/AnimatedFaceHint';
import { SuccessOverlay } from '../../components/SuccessOverlay';
import * as ImageManipulator from 'expo-image-manipulator';

// Guided enrollment steps with instructions and animated hint directions
const ENROLLMENT_STEPS: { label: string; instruction: string; hint: FaceHintStep }[] = [
  { label: 'Look Straight', instruction: 'Face the camera directly', hint: 'straight' },
  { label: 'Turn Left', instruction: 'Slowly turn your head to the left', hint: 'left' },
  { label: 'Turn Right', instruction: 'Slowly turn your head to the right', hint: 'right' },
  { label: 'Tilt Up', instruction: 'Tilt your chin slightly upward', hint: 'up' },
  { label: 'Tilt Down', instruction: 'Tilt your chin slightly downward', hint: 'down' },
  { label: 'Natural Smile', instruction: 'Look straight and give a natural smile', hint: 'straight' },
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
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const photosRef = useRef<string[]>([]);
  const buffersRef = useRef<{ uri: string; name: string; type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [enrollmentDone, setEnrollmentDone] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState<{ anglesEnrolled: number; totalAngles: number } | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);

  // Countdown timer for auto-capture
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Camera flash animation on capture
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchStudents();
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, []);

  // Pulse animation for guide oval when countdown is active
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

  const triggerFlash = () => {
    flashAnim.setValue(0.7);
    Animated.timing(flashAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
  };

  const startCountdownCapture = () => {
    if (isProcessing || !cameraRef.current) return;
    setStatusMessage(null);
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
      const rawPhoto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!rawPhoto) throw new Error('Failed to capture image');

      const manipResult = await ImageManipulator.manipulateAsync(
        rawPhoto.uri,
        [{ resize: { width: 500 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      const photo = { uri: manipResult.uri };

      triggerFlash();

      // Use refs to avoid stale React state in sequential captures
      const newPhotos = [...photosRef.current, photo.uri];
      const newBuffers = [
        ...buffersRef.current,
        { uri: photo.uri, name: `angle_${currentStep}.jpg`, type: 'image/jpeg' },
      ];
      photosRef.current = newPhotos;
      buffersRef.current = newBuffers;
      setCapturedPhotos(newPhotos);

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
    setUploadFailed(false);

    try {
      const formData = new FormData();
      buffers.forEach((buf) => {
        formData.append('images', { uri: buf.uri, name: buf.name, type: buf.type } as any);
      });

      const studentId = selectedStudent._id || selectedStudent.id;
      const response = await apiClient.post(`/attendance/enroll/${studentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      if (response.data.success) {
        const { anglesEnrolled, totalAngles, warnings } = response.data.data;
        setEnrollmentResult({ anglesEnrolled, totalAngles });
        if (warnings?.length) {
          setStatusMessage(`Warnings: ${warnings.join(', ')}`);
          setStatusType('basic');
        }
        setEnrollmentDone(true);
      }
    } catch (error: any) {
      const isNetworkErr = error.message === 'Network Error';
      const errMessage = error.response?.data?.error?.message
        || (isNetworkErr ? 'Network error — check your connection and try again' : error.message)
        || 'Enrollment failed';
      setStatusMessage(errMessage);
      setStatusType('danger');
      setUploadFailed(true); // allow retry without re-capturing
    } finally {
      setIsUploading(false);
    }
  };

  const resetEnrollment = () => {
    setCurrentStep(0);
    setCapturedPhotos([]);
    photosRef.current = [];
    buffersRef.current = [];
    setStatusMessage(null);
    setStatusType('basic');
    setEnrollmentDone(false);
    setEnrollmentResult(null);
    setUploadFailed(false);
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

  const selectedStudent = students[selectedIndex.row];

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
          {/* Step instruction banner with animated face hint */}
          {!enrollmentDone && (
            <View style={[styles.instructionBanner, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
              <View style={styles.instructionRow}>
                <View style={styles.instructionText}>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                </View>
                <AnimatedFaceHint step={step.hint} size={72} />
              </View>
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

          {/* Camera flash feedback */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'white', opacity: flashAnim }]}
          />

          {/* Countdown overlay */}
          {countdown !== null && (
            <Text style={styles.countdownText}>{countdown}</Text>
          )}

          {/* Step progress — numbered circles */}
          <View style={styles.progressDots}>
            {ENROLLMENT_STEPS.map((_s, i) => {
              const isDone = i < capturedPhotos.length;
              const isCurrent = i === currentStep;
              const bgColor = isDone
                ? theme['color-success-400']
                : isCurrent
                ? theme['color-warning-400']
                : 'rgba(255,255,255,0.35)';
              return (
                <View
                  key={i}
                  style={[styles.stepCircle, { backgroundColor: bgColor, borderColor: isDone || isCurrent ? 'white' : 'rgba(255,255,255,0.4)' }]}
                >
                  <Text style={[styles.stepNum, { color: isDone || isCurrent ? 'white' : 'rgba(255,255,255,0.6)' }]}>
                    {isDone ? '✓' : String(i + 1)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </CameraView>

      {/* Footer controls */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md, backgroundColor: theme['background-basic-color-1'] }]}>
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
        {statusMessage && !enrollmentDone && (
          <Text status={statusType} style={{ textAlign: 'center', marginBottom: spacing.md }}>
            {statusMessage}
          </Text>
        )}

        {/* Action buttons */}
        {isUploading ? (
          <View style={{ alignItems: 'center', padding: spacing.md }}>
            <Spinner size="large" status="success" />
            <Text style={{ marginTop: spacing.sm, color: theme['text-basic-color'] }}>Uploading face data...</Text>
          </View>
        ) : uploadFailed ? (
          <View style={{ gap: spacing.sm }}>
            <Button size="large" status="danger" onPress={() => uploadEnrollment(buffersRef.current)}>
              Retry Upload
            </Button>
            <Button size="large" appearance="outline" status="basic" onPress={resetEnrollment}>
              Start Over
            </Button>
          </View>
        ) : !enrollmentDone ? (
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
        ) : null}
      </View>

      {/* Success overlay — shown after upload succeeds */}
      <SuccessOverlay
        visible={enrollmentDone}
        title="Enrollment Complete!"
        subtitle={`${enrollmentResult?.anglesEnrolled ?? 0} angles enrolled for ${selectedStudent?.name ?? 'student'}.\nTotal: ${enrollmentResult?.totalAngles ?? 0} angles on file.`}
        autoDismissMs={0}
        onDismiss={undefined}
      />

      {/* Buttons rendered over success overlay */}
      {enrollmentDone && (
        <View style={[styles.successActions, { bottom: (insets.bottom || spacing.md) + spacing.md }]}>
          <Button size="large" status="success" onPress={resetEnrollment} style={{ marginBottom: spacing.sm }}>
            {user?.role === UserRole.STUDENT ? 'Enroll Again' : 'Enroll Another Student'}
          </Button>
          <Button size="large" appearance="outline" status="control" onPress={() => navigation.goBack()}>
            Done
          </Button>
        </View>
      )}
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
    left: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  stepLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepInstruction: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
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
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  footer: {
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
  successActions: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
  },
});
