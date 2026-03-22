import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@ui-kitten/components';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  /** 'success' = green, 'info' = blue */
  type?: 'success' | 'info';
  /** Auto-dismiss after this many ms (0 = no auto-dismiss) */
  autoDismissMs?: number;
  onDismiss?: () => void;
}

/**
 * Full-screen animated overlay shown after a successful action.
 * Uses a spring-animated checkmark circle so the feedback is
 * unmistakable even for non-technical users.
 */
export const SuccessOverlay: React.FC<Props> = ({
  visible,
  title,
  subtitle,
  type = 'success',
  autoDismissMs = 2500,
  onDismiss,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      checkOpacity.value = withDelay(250, withTiming(1, { duration: 300 }));

      if (autoDismissMs > 0 && onDismiss) {
        const timer = setTimeout(() => {
          opacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) }, () => {
            runOnJS(onDismiss)();
          });
        }, autoDismissMs);
        return () => clearTimeout(timer);
      }
    } else {
      scale.value = 0;
      opacity.value = 0;
      checkOpacity.value = 0;
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: checkOpacity.value }));

  if (!visible) return null;

  const circleColor = type === 'info' ? '#1976D2' : '#2E7D32';
  const borderColor = type === 'info' ? '#42A5F5' : '#4CAF50';

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <Animated.View style={[styles.circle, { backgroundColor: circleColor, borderColor }, circleStyle]}>
        <Animated.View style={checkStyle}>
          <Svg width={64} height={64} viewBox="0 0 64 64">
            <Circle cx={32} cy={32} r={30} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
            <Path
              d="M16 32 L27 43 L48 22"
              fill="none"
              stroke="white"
              strokeWidth={4.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </Animated.View>

      <Text category="h4" style={styles.title}>{title}</Text>
      {subtitle ? (
        <Text category="s1" style={styles.subtitle}>{subtitle}</Text>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  circle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
