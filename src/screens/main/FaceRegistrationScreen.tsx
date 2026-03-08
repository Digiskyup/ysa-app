import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Layout, Text, Button, Spinner, useTheme, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius } from '../../theme';
import axios from 'axios';
import { useAppSelector } from '../../redux/hooks';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const FaceRegistrationScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'danger' | 'basic'>('basic');
  const cameraRef = useRef<CameraView>(null);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const token = useAppSelector((state) => state.auth.accessToken);

  // Student list state for selection
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<IndexPath>(new IndexPath(0));
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Fetch all students without a registered face yet
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/users?role=student`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // We could filter only students where faceDescriptor is null or empty
        setStudents(response.data.data.users || []);
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
          We need camera permission to enroll student faces.
        </Text>
        <Button onPress={requestPermission}>Grant Permission</Button>
      </Layout>
    );
  }

  const handleEnroll = async () => {
    if (isProcessing || !cameraRef.current) return;
    if (students.length === 0) return;
    
    setIsProcessing(true);
    setStatusMessage('Enrolling face...');
    setStatusType('basic');

    const selectedStudent = students[selectedIndex.row];

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (!photo || !photo.base64) {
         throw new Error('Failed to capture image');
      }

      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: 'enrollment.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await axios.post(`${API_URL}/attendance/enroll/${selectedStudent._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setStatusMessage('Face registered successfully!');
        setStatusType('success');
      }
    } catch (error: any) {
      console.error(error);
      const errMessage = error.response?.data?.error?.message || error.message || 'Enrollment failed';
      setStatusMessage(errMessage);
      setStatusType('danger');
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setStatusMessage(null);
        setStatusType('basic');
        fetchStudents(); // Refresh student list 
      }, 3000);
    }
  };

  const displayValue = students.length > 0 
    ? `${students[selectedIndex.row]?.name} (${students[selectedIndex.row]?.email})`
    : 'No students found';

  return (
    <Layout style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: theme['color-success-500'] }]}>
        <Text category="h5" style={{ color: 'white', fontWeight: 'bold' }}>
          Face Enrollment
        </Text>
        <Button size="tiny" appearance="ghost" status="control" onPress={() => navigation.goBack()}>
            Cancel
        </Button>
      </View>

      <CameraView 
        style={styles.camera} 
        facing="front" 
        ref={cameraRef}
      >
        <View style={styles.overlay}>
          <View style={[styles.guideCircle, { borderColor: theme['color-success-400'] }]} />
        </View>
      </CameraView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md }]}>
        <Text category="s1" style={{ marginBottom: spacing.sm, textAlign: 'center' }}>
            Select Student to Enroll:
        </Text>
        
        {isLoadingStudents ? (
            <Spinner />
        ) : (
            <Select
                selectedIndex={selectedIndex}
                value={displayValue}
                onSelect={(index: any) => setSelectedIndex(index)}
                style={{ marginBottom: spacing.md }}
                disabled={students.length === 0}
            >
                {students.map((student, idx) => (
                    <SelectItem key={idx} title={`${student.name} (${student.email})`} />
                ))}
            </Select>
        )}

        {statusMessage && (
            <Text status={statusType} style={{ textAlign: 'center', marginBottom: spacing.md }}>
                {statusMessage}
            </Text>
        )}

        <Button 
          size="giant" 
          status="success"
          onPress={handleEnroll}
          disabled={isProcessing || students.length === 0}
          style={styles.captureButton}
        >
          {isProcessing ? 'Processing...' : 'Register Face'}
        </Button>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  guideCircle: {
    width: 250,
    height: 350,
    borderWidth: 3,
    borderRadius: 150,
    borderStyle: 'dashed',
  },
  footer: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    elevation: 5,
  },
  captureButton: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
  },
});
