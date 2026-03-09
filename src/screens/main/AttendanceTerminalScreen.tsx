import React, { useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Layout, Text, Button, Spinner, useTheme, Input } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius } from '../../theme';
import axios from 'axios';
import { useAppSelector } from '../../redux/hooks';
import apiClient from '../../services/api/client';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    flex: 1,
    padding: spacing.xl,
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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    backgroundColor: '#fff',
  },
  toastContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: '#388E3C', // Success green
    padding: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    zIndex: 1000,
  },
  toastText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export const AttendanceTerminalScreen = ({ navigation }: any) => {
  const [kioskStep, setKioskStep] = useState<'input_id' | 'capture_face'>('input_id');
  const [studentIdentifier, setStudentIdentifier] = useState('');
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);
  
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'danger' | 'basic'>('basic');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualIdentifier, setManualIdentifier] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
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

  const handleNextStep = async () => {
    if (!studentIdentifier || isCheckingId) return;
    
    setIsCheckingId(true);
    setIdError(null);
    
    try {
      const response = await apiClient.post(`/attendance/check-student`, {
        identifier: studentIdentifier.trim(),
      });
      
      if (response.data.success) {
        setKioskStep('capture_face');
      }
    } catch (error: any) {
      console.error(error);
      const errMessage = error.response?.data?.error?.message || error.message || 'Verification failed';
      setIdError(errMessage);
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleCapture = async () => {
    if (isProcessing || !cameraRef.current) return;
    
    setIsProcessing(true);
    setStatusMessage('Scanning face...');
    setStatusType('basic');

    let successMsg = '';

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (!photo || !photo.base64) {
         throw new Error('Failed to capture image');
      }

      const formData = new FormData();
      formData.append('identifier', studentIdentifier);
      formData.append('image', {
        uri: photo.uri,
        name: 'attendance.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await apiClient.post(`/attendance/verify`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        successMsg = response.data.data.message + ` (${response.data.data.studentName})`;
      }
    } catch (error: any) {
      console.error(error);
      const errMessage = error.response?.data?.error?.message || error.message || 'Recognition failed';
      setStatusMessage(errMessage);
      setStatusType('danger');
    } finally {
      setIsProcessing(false);
      
      if (successMsg) {
         // Instant transition to next student
         setToastMessage(successMsg);
         setStudentIdentifier('');
         setStatusMessage(null);
         setStatusType('basic');
         setKioskStep('input_id');
         
         setTimeout(() => {
           setToastMessage(null);
         }, 3000);
      } else {
         // If failed, let them try again after seeing error on the camera screen
         setTimeout(() => {
            setStatusMessage(null);
            setStatusType('basic');
         }, 4000);
      }
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualIdentifier) return;
    setIsSubmittingManual(true);
    setStatusMessage(null);
    let successMsg = '';
    
    try {
      const response = await apiClient.post(`/attendance/manual`, 
        { identifier: manualIdentifier }
      );

      if (response.data.success) {
        successMsg = response.data.data.message + ` (${response.data.data.studentName})`;
      }
    } catch (error: any) {
      console.error(error);
      const errMessage = error.response?.data?.error?.message || error.message || 'Manual Check-in failed';
      setStatusMessage(errMessage);
      setStatusType('danger');
    } finally {
      setIsSubmittingManual(false);
      
      if (successMsg) {
         // Auto-close and reset kiosk for next student immediately
         setToastMessage(successMsg);
         setManualModalVisible(false);
         setManualIdentifier('');
         setStudentIdentifier('');
         setStatusMessage(null);
         setStatusType('basic');
         setKioskStep('input_id');
         
         setTimeout(() => {
           setToastMessage(null);
         }, 3000);
      } else {
         setTimeout(() => {
           setStatusMessage(null);
           setStatusType('basic');
         }, 4000);
      }
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

      {kioskStep === 'input_id' ? (
        <View style={styles.stepContainer}>
          <Text category="h4" style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
            Welcome to Class
          </Text>
          <Text category="s1" appearance="hint" style={{ marginBottom: spacing.xl, textAlign: 'center' }}>
            Please enter your registered Phone Number or Email to begin.
          </Text>

          <Layout style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Input
                placeholder="e.g. 9876543210 or email@domain.com"
                value={studentIdentifier}
                onChangeText={setStudentIdentifier}
                style={{ width: '100%' }}
                textStyle={{ textAlign: 'center', fontSize: 18 }}
                size="large"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </Layout>
          
          {idError && (
             <Text status="danger" style={{ textAlign: 'center', marginBottom: spacing.md }}>
               {idError}
             </Text>
          )}

          <Button 
            size="giant" 
            style={{ marginTop: spacing.xl, borderRadius: borderRadius.xl }}
            disabled={!studentIdentifier || isCheckingId}
            onPress={handleNextStep}
          >
            {isCheckingId ? 'Verifying Student...' : 'Next: Verify Face'}
          </Button>

          <Button 
            appearance="outline"
            onPress={() => setManualModalVisible(true)}
            style={{ marginTop: spacing.lg, borderRadius: borderRadius.lg }}
          >
            Manual Check-in
          </Button>

          <Button 
            appearance="ghost" 
            status="basic" 
            onPress={() => navigation.goBack()}
            style={[styles.exitButton, { marginTop: spacing['2xl'] }]}
          >
            Exit Kiosk mode
          </Button>
        </View>
      ) : (
        <>
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
              {isProcessing ? 'Verifying...' : 'Capture & Verify'}
            </Button>

            <Button 
              appearance="ghost" 
              status="basic" 
              onPress={() => setKioskStep('input_id')}
              style={styles.exitButton}
            >
              Back
            </Button>
          </View>
        </>
      )}

      {/* Manual Check-in Overlay */}
      {manualModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text category="h6" style={{ marginBottom: spacing.md }}>Manual Check-in</Text>
            <Text category="s2" appearance="hint" style={{ marginBottom: spacing.lg }}>
              If face recognition fails or student has no profile photo, use their registered Phone or Email.
            </Text>
            
            <Layout style={styles.inputContainer}>
              <Text category="label" style={{ marginBottom: spacing.xs }}>Phone or Email</Text>
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="e.g. 9876543210 or email@domain.com"
                  value={manualIdentifier}
                  onChangeText={setManualIdentifier}
                  style={{ width: '100%' }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </Layout>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md }}>
              <Button 
                appearance="ghost" 
                status="basic" 
                onPress={() => setManualModalVisible(false)}
                style={{ marginRight: spacing.sm }}
                disabled={isSubmittingManual}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleManualCheckIn}
                disabled={isSubmittingManual || !manualIdentifier}
              >
                {isSubmittingManual ? 'Submitting...' : 'Mark Attendance'}
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* Global Success Toast */}
      {toastMessage && (
        <View style={[styles.toastContainer, { bottom: insets.bottom + spacing.xl }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </Layout>
  );
};
