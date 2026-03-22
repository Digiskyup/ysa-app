import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { Layout, Text, Button, Spinner, useTheme, Input } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius } from '../../theme';
import AttendanceService from '../../services/AttendanceService';
import { i18n } from '../../i18n';
import { SuccessOverlay } from '../../components/SuccessOverlay';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: '#B71C1C',
    alignItems: 'center',
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
    borderRadius: 150,
    borderStyle: 'dashed',
  },
  guidanceText: {
    position: 'absolute',
    bottom: 100,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  countdownOverlay: {
    position: 'absolute',
    color: 'white',
    fontSize: 80,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  footer: {
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
  exitButton: { alignSelf: 'center' },
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
  inputContainer: { marginBottom: spacing.lg },
  inputWrapper: { backgroundColor: '#fff' },
});


export const AttendanceTerminalScreen = ({ navigation }: any) => {
  const [kioskStep, setKioskStep] = useState<'input_id' | 'capture_face'>('input_id');
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [studentName, setStudentName] = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);
  const [idAlreadyMarked, setIdAlreadyMarked] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'danger' | 'basic'>('basic');
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualIdentifier, setManualIdentifier] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Offline detection — set true when a Network Error is received
  const [isOffline, setIsOffline] = useState(false);

  // Success overlay state
  const [successVisible, setSuccessVisible] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successSubtitle, setSuccessSubtitle] = useState('');
  const [successType, setSuccessType] = useState<'success' | 'info'>('success');

  // Face detection state
  const [faceDetected, setFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const stableTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureInProgress = useRef(false);
  const [isCaptureInProgress, setIsCaptureInProgress] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const resetCaptureStep = useCallback(() => {
    setFaceDetected(false);
    setCountdown(null);
    captureInProgress.current = false;
    setIsCaptureInProgress(false);
    if (stableTimer.current) {
      clearTimeout(stableTimer.current);
      stableTimer.current = null;
    }
  }, []);

  const handleCaptureRef = useRef<() => void>(() => {});

  const handleFacesDetected = useCallback(({ faces }: { faces: any[] }) => {
    if (isProcessing || captureInProgress.current || kioskStep !== 'capture_face') return;

    if (faces.length === 1) {
      const face = faces[0];
      const isRoughlyCenter = face.bounds?.origin?.x > 40 && face.bounds?.origin?.y > 60;

      if (isRoughlyCenter && !faceDetected) {
        setFaceDetected(true);
        let count = 3;
        setCountdown(count);
        const tick = () => {
          count -= 1;
          if (count > 0) {
            setCountdown(count);
            stableTimer.current = setTimeout(tick, 700);
          } else {
            setCountdown(null);
            handleCaptureRef.current();
          }
        };
        stableTimer.current = setTimeout(tick, 700);
      }
    } else {
      if (faceDetected && !captureInProgress.current) {
        setFaceDetected(false);
        setCountdown(null);
        if (stableTimer.current) {
          clearTimeout(stableTimer.current);
          stableTimer.current = null;
        }
      }
    }
  }, [isProcessing, faceDetected, kioskStep]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <Layout style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ textAlign: 'center', marginBottom: spacing.md }}>
          {i18n.t('kiosk_camera_permission_required')}
        </Text>
        <Button onPress={requestPermission}>{i18n.t('kiosk_grant_permission')}</Button>
      </Layout>
    );
  }

  const handleNetworkError = () => setIsOffline(true);
  const handleNetworkSuccess = () => setIsOffline(false);

  const showSuccess = (title: string, subtitle: string, type: 'success' | 'info') => {
    setSuccessTitle(title);
    setSuccessSubtitle(subtitle);
    setSuccessType(type);
    setSuccessVisible(true);
  };

  const handleSuccessDismiss = () => {
    setSuccessVisible(false);
    setStudentIdentifier('');
    setStudentName(null);
    setStatusMessage(null);
    setStatusType('basic');
    setKioskStep('input_id');
    resetCaptureStep();
  };

  const handleNextStep = async () => {
    if (!studentIdentifier || isCheckingId) return;
    setIsCheckingId(true);
    setIdError(null);
    setIdAlreadyMarked(false);

    try {
      const response = await AttendanceService.checkStudent(studentIdentifier.trim());
      handleNetworkSuccess();
      if (response) {
        setStudentName(response.studentName);
        resetCaptureStep();
        setKioskStep('capture_face');
      }
    } catch (error: any) {
      let errMessage = error.response?.data?.error?.message || error.message || i18n.t('kiosk_err_verification_failed');
      if (errMessage === 'Network Error') {
        errMessage = i18n.t('kiosk_err_network');
        handleNetworkError();
      } else if (errMessage === 'Attendance already marked for today') {
        // This is actually good news — student is already checked in
        setIdAlreadyMarked(true);
        setIdError('Already checked in for today!');
        return;
      }
      setIdError(errMessage);
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleCapture = async () => {
    if (isProcessing || captureInProgress.current || !cameraRef.current) return;
    captureInProgress.current = true;
    setIsCaptureInProgress(true);
    setIsProcessing(true);
    setStatusMessage(i18n.t('kiosk_scanning_face'));
    setStatusType('basic');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) throw new Error('Failed to capture image');

      const response = await AttendanceService.verify(studentIdentifier, photo.uri);
      handleNetworkSuccess();

      if (response) {
        if (response.alreadyMarked) {
          showSuccess(
            'Already Checked In',
            `${response.studentName} has already marked attendance today.`,
            'info',
          );
        } else {
          showSuccess(
            'Attendance Marked!',
            `Welcome, ${response.studentName}!`,
            'success',
          );
        }
      }
    } catch (error: any) {
      let errMessage = error.response?.data?.error?.message || error.message || i18n.t('kiosk_err_recognition_failed');
      if (errMessage === 'Network Error' || errMessage.includes('timeout')) {
        errMessage = i18n.t('kiosk_err_timeout');
        handleNetworkError();
      }

      // If no face enrolled, auto-open manual check-in modal
      if (errMessage.includes('No face enrolled')) {
        setStatusMessage('No face enrolled for this student.');
        setStatusType('danger');
        setManualIdentifier(studentIdentifier);
        setTimeout(() => setManualModalVisible(true), 800);
      } else {
        setStatusMessage(errMessage);
        setStatusType('danger');
      }

      setTimeout(() => {
        setStatusMessage(null);
        setStatusType('basic');
        resetCaptureStep();
      }, 4000);
    } finally {
      setIsProcessing(false);
      captureInProgress.current = false;
      setIsCaptureInProgress(false);
    }
  };

  handleCaptureRef.current = handleCapture;

  const handleManualCheckIn = async () => {
    if (!manualIdentifier) return;
    setIsSubmittingManual(true);
    setStatusMessage(null);

    try {
      const response = await AttendanceService.manualCheckIn(manualIdentifier);
      handleNetworkSuccess();
      if (response) {
        setManualModalVisible(false);
        setManualIdentifier('');
        if (response.alreadyMarked) {
          showSuccess('Already Checked In', `${response.studentName} already marked today.`, 'info');
        } else {
          showSuccess('Attendance Marked!', `Welcome, ${response.studentName}!`, 'success');
        }
      }
    } catch (error: any) {
      const errMessage = error.response?.data?.error?.message || error.message || i18n.t('kiosk_err_manual_failed');
      if (errMessage === 'Network Error') handleNetworkError();
      setStatusMessage(errMessage);
      setStatusType('danger');
      setTimeout(() => {
        setStatusMessage(null);
        setStatusType('basic');
      }, 4000);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const ovalColor = faceDetected
    ? (countdown !== null ? '#FFC107' : '#4CAF50')
    : 'rgba(255,255,255,0.5)';

  return (
    <Layout style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: theme['color-primary-500'] }]}>
        <Text category="h5" style={{ color: 'white', fontWeight: 'bold' }}>
          {i18n.t('kiosk_title')}
        </Text>
      </View>

      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>
            No internet connection — face verification requires network.
          </Text>
        </View>
      )}

      {kioskStep === 'input_id' ? (
        <View style={styles.stepContainer}>
          <Text category="h4" style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
            {i18n.t('kiosk_welcome')}
          </Text>
          <Text category="s1" appearance="hint" style={{ marginBottom: spacing.xl, textAlign: 'center' }}>
            {i18n.t('kiosk_instruction')}
          </Text>

          <Layout style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Input
                placeholder={i18n.t('kiosk_input_placeholder')}
                value={studentIdentifier}
                onChangeText={(v) => {
                  setStudentIdentifier(v);
                  setIdError(null);
                  setIdAlreadyMarked(false);
                }}
                style={{ width: '100%' }}
                textStyle={{ textAlign: 'center', fontSize: 18 }}
                size="large"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </Layout>

          {idError && (
            <Text
              status={idAlreadyMarked ? 'success' : 'danger'}
              style={{ textAlign: 'center', marginBottom: spacing.md }}
            >
              {idAlreadyMarked ? '✓ ' : ''}{idError}
            </Text>
          )}

          <Button
            size="giant"
            style={{ marginTop: spacing.xl, borderRadius: borderRadius.xl }}
            disabled={!studentIdentifier || isCheckingId}
            onPress={handleNextStep}
          >
            {isCheckingId ? i18n.t('kiosk_verifying_student') : i18n.t('kiosk_next_verify_face')}
          </Button>

          <Button
            appearance="outline"
            onPress={() => setManualModalVisible(true)}
            style={{ marginTop: spacing.lg, borderRadius: borderRadius.lg }}
          >
            {i18n.t('kiosk_manual_checkin')}
          </Button>

          <Button
            appearance="ghost"
            status="basic"
            onPress={() => navigation.goBack()}
            style={[styles.exitButton, { marginTop: spacing['2xl'] }]}
          >
            {i18n.t('kiosk_exit')}
          </Button>
        </View>
      ) : (
        <>
          <CameraView
            style={styles.camera}
            facing="front"
            ref={cameraRef}
            {...({
              onFacesDetected: handleFacesDetected,
              faceDetectorSettings: {
                mode: FaceDetector.FaceDetectorMode.fast,
                detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                runClassifications: FaceDetector.FaceDetectorClassifications.none,
                minDetectionInterval: 200,
                tracking: true,
              },
            } as any)}
          >
            <View style={styles.overlay}>
              <View style={[styles.guideCircle, { borderColor: ovalColor, borderStyle: faceDetected ? 'solid' : 'dashed' }]} />

              {countdown !== null && (
                <Text style={styles.countdownOverlay}>{countdown}</Text>
              )}

              <Text style={styles.guidanceText}>
                {isProcessing
                  ? 'Verifying...'
                  : countdown !== null
                  ? `Hold still... ${countdown}`
                  : faceDetected
                  ? 'Face detected! Hold still...'
                  : 'Position your face inside the oval'}
              </Text>
            </View>
          </CameraView>

          {/* Control Panel */}
          <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md, backgroundColor: theme['background-basic-color-1'] }]}>
            <View style={styles.statusBox}>
              {isProcessing ? (
                <Spinner status="primary" />
              ) : statusMessage ? (
                <Text status={statusType} category="h6" style={{ textAlign: 'center' }}>
                  {statusMessage}
                </Text>
              ) : (
                <Text category="s1" appearance="hint" style={{ textAlign: 'center' }}>
                  {studentName ? `Verifying ${studentName}...` : faceDetected ? 'Face detected — auto-capturing soon...' : i18n.t('kiosk_look_camera')}
                </Text>
              )}
            </View>

            <Button
              size="giant"
              onPress={handleCapture}
              disabled={isProcessing || isCaptureInProgress}
              style={styles.captureButton}
              appearance="outline"
            >
              {isProcessing ? i18n.t('kiosk_verifying') : 'Capture Manually'}
            </Button>

            <Button
              appearance="ghost"
              status="basic"
              onPress={() => {
                resetCaptureStep();
                setKioskStep('input_id');
                setStatusMessage(null);
              }}
              style={styles.exitButton}
            >
              {i18n.t('kiosk_back')}
            </Button>
          </View>
        </>
      )}

      {/* Manual Check-in Overlay */}
      {manualModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text category="h6" style={{ marginBottom: spacing.md }}>{i18n.t('kiosk_manual_title')}</Text>
            <Text category="s2" appearance="hint" style={{ marginBottom: spacing.lg }}>
              {i18n.t('kiosk_manual_desc')}
            </Text>

            <Layout style={styles.inputContainer}>
              <Text category="label" style={{ marginBottom: spacing.xs }}>{i18n.t('kiosk_phone_email')}</Text>
              <View style={styles.inputWrapper}>
                <Input
                  placeholder={i18n.t('kiosk_input_placeholder')}
                  value={manualIdentifier}
                  onChangeText={setManualIdentifier}
                  style={{ width: '100%' }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </Layout>

            {statusMessage && (
              <Text status={statusType} style={{ marginBottom: spacing.sm, textAlign: 'center' }}>
                {statusMessage}
              </Text>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md }}>
              <Button
                appearance="ghost"
                status="basic"
                onPress={() => { setManualModalVisible(false); setManualIdentifier(''); }}
                style={{ marginRight: spacing.sm }}
                disabled={isSubmittingManual}
              >
                {i18n.t('kiosk_cancel')}
              </Button>
              <Button
                onPress={handleManualCheckIn}
                disabled={isSubmittingManual || !manualIdentifier}
              >
                {isSubmittingManual ? i18n.t('kiosk_submitting') : i18n.t('kiosk_mark_attendance')}
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* Animated success/info overlay */}
      <SuccessOverlay
        visible={successVisible}
        title={successTitle}
        subtitle={successSubtitle}
        type={successType}
        autoDismissMs={2500}
        onDismiss={handleSuccessDismiss}
      />
    </Layout>
  );
};
