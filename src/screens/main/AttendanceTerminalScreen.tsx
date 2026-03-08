import React, { useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Layout, Text, Button, Spinner, useTheme } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius } from '../../theme';
import axios from 'axios';
import { useAppSelector } from '../../redux/hooks';

// Ensure you have an appropriate API URL configured
// e.g. from process.env.API_URL or config files
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const AttendanceTerminalScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'danger' | 'basic'>('basic');
  const cameraRef = useRef<CameraView>(null);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const token = useAppSelector((state) => state.auth.accessToken);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Layout style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ textAlign: 'center', marginBottom: spacing.md }}>
          We need your permission to show the camera for the Attendance Kiosk.
        </Text>
        <Button onPress={requestPermission}>Grant Permission</Button>
      </Layout>
    );
  }

  const handleCapture = async () => {
    if (isProcessing || !cameraRef.current) return;
    
    setIsProcessing(true);
    setStatusMessage('Scanning face...');
    setStatusType('basic');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (!photo || !photo.base64) {
         throw new Error('Failed to capture image');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: 'attendance.jpg',
        type: 'image/jpeg',
      } as any);

      // POST to backend
      const response = await axios.post(`${API_URL}/attendance/recognize`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setStatusMessage(response.data.data.message + ` (${response.data.data.studentName})`);
        setStatusType('success');
      }
    } catch (error: any) {
      console.error(error);
      const errMessage = error.response?.data?.error?.message || error.message || 'Recognition failed';
      setStatusMessage(errMessage);
      setStatusType('danger');
    } finally {
      setIsProcessing(false);
      // Clear status message after 3 seconds to get ready for next student
      setTimeout(() => {
        setStatusMessage(null);
        setStatusType('basic');
      }, 3000);
    }
  };

  return (
    <Layout style={styles.container}>
      {/* Kiosk Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: theme['color-primary-500'] }]}>
        <Text category="h5" style={{ color: 'white', fontWeight: 'bold' }}>
          Attendance Kiosk
        </Text>
      </View>

      <CameraView 
        style={styles.camera} 
        facing="front" 
        ref={cameraRef}
      >
        <View style={styles.overlay}>
          {/* Guide circle */}
          <View style={styles.guideCircle} />
        </View>
      </CameraView>

      {/* Control Panel */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md }]}>
        <View style={styles.statusBox}>
          {isProcessing ? (
             <Spinner status="primary" />
          ) : statusMessage ? (
             <Text status={statusType} category="h6" style={{ textAlign: 'center' }}>
               {statusMessage}
             </Text>
          ) : (
             <Text category="h6" appearance="hint" style={{ textAlign: 'center' }}>
               Please look at the camera
             </Text>
          )}
        </View>

        <Button 
          size="giant" 
          onPress={handleCapture}
          disabled={isProcessing}
          style={styles.captureButton}
        >
          {isProcessing ? 'Processing...' : 'Mark Attendance'}
        </Button>

        <Button 
          appearance="ghost" 
          status="basic" 
          onPress={() => navigation.goBack()}
          style={styles.exitButton}
        >
          Exit Kiosk (Admin Only)
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
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 150,
    borderStyle: 'dashed',
  },
  footer: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statusBox: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  captureButton: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  exitButton: {
    alignSelf: 'center',
  },
});
