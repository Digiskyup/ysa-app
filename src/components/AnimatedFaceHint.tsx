import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Ellipse, Circle, Path, Line } from 'react-native-svg';

export type FaceHintStep = 'straight' | 'left' | 'right' | 'up' | 'down';

interface Props {
  step: FaceHintStep;
  size?: number;
}

/**
 * Animated SVG face illustration that shows the user how to orient
 * their head for each face enrollment step. Loops continuously so
 * non-technical users understand what motion is expected.
 */
export const AnimatedFaceHint: React.FC<Props> = ({ step, size = 80 }) => {
  const rotateY = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotateY.value = 0;
    rotateX.value = 0;
    scale.value = 1;

    const dur = 700;
    const pause = 400;

    if (step === 'straight') {
      // Gentle pulse to indicate "look here"
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else if (step === 'left') {
      rotateY.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(0, { duration: pause }),
            withTiming(-28, { duration: dur, easing: Easing.inOut(Easing.ease) }),
            withTiming(-28, { duration: pause }),
            withTiming(0, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );
    } else if (step === 'right') {
      rotateY.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(0, { duration: pause }),
            withTiming(28, { duration: dur, easing: Easing.inOut(Easing.ease) }),
            withTiming(28, { duration: pause }),
            withTiming(0, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );
    } else if (step === 'up') {
      rotateX.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(0, { duration: pause }),
            withTiming(-22, { duration: dur, easing: Easing.inOut(Easing.ease) }),
            withTiming(-22, { duration: pause }),
            withTiming(0, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );
    } else if (step === 'down') {
      rotateX.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(0, { duration: pause }),
            withTiming(22, { duration: dur, easing: Easing.inOut(Easing.ease) }),
            withTiming(22, { duration: pause }),
            withTiming(0, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );
    }
  }, [step]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 400 },
      { rotateY: `${rotateY.value}deg` },
      { rotateX: `${rotateX.value}deg` },
      { scale: scale.value },
    ],
  }));

  // Face proportions relative to `size`
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const headRx = s * 0.34;
  const headRy = s * 0.42;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={animatedStyle}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          {/* Head outline */}
          <Ellipse
            cx={cx}
            cy={cy}
            rx={headRx}
            ry={headRy}
            fill="rgba(255,255,255,0.15)"
            stroke="white"
            strokeWidth={2.5}
          />

          {/* Left eye */}
          <Circle cx={cx - headRx * 0.38} cy={cy - headRy * 0.18} r={s * 0.045} fill="white" />

          {/* Right eye */}
          <Circle cx={cx + headRx * 0.38} cy={cy - headRy * 0.18} r={s * 0.045} fill="white" />

          {/* Nose */}
          <Line
            x1={cx}
            y1={cy - headRy * 0.05}
            x2={cx}
            y2={cy + headRy * 0.18}
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Mouth */}
          <Path
            d={`M ${cx - headRx * 0.3} ${cy + headRy * 0.3} Q ${cx} ${cy + headRy * 0.46} ${cx + headRx * 0.3} ${cy + headRy * 0.3}`}
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
