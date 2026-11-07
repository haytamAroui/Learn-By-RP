import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

export interface LivingVoiceOrbProps {
  state?: 'idle' | 'listening' | 'speaking' | 'connecting';
  size?: number;
}

export const LivingVoiceOrb: React.FC<LivingVoiceOrbProps> = ({
  state = 'idle',
  size = 180,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous breathing float animation
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: state === 'speaking' ? 1.08 : state === 'listening' ? 1.05 : 1.03,
          duration: state === 'speaking' ? 700 : 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.97,
          duration: state === 'speaking' ? 700 : 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    breathLoop.start();
    return () => breathLoop.stop();
  }, [state, pulseAnim]);

  useEffect(() => {
    // Listening ripples animation
    if (state === 'listening') {
      const rippleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(rippleAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      rippleLoop.start();
      return () => rippleLoop.stop();
    } else {
      rippleAnim.setValue(0);
    }
  }, [state, rippleAnim]);

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 0.2, 0],
  });

  return (
    <View
      style={{
        width: size * 1.5,
        height: size * 1.5,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel={`Gespreksanimatie: ${state}`}
    >
      {/* Listening Aura Ring 1 */}
      {state === 'listening' ? (
        <Animated.View
          style={{
            position: 'absolute',
            width: size * 1.25,
            height: size * 1.25,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: '#FF7A63',
            transform: [{ scale: rippleScale }],
            opacity: rippleOpacity,
          }}
        />
      ) : null}

      {/* Floating Floor Shadow */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.1,
          width: size * 0.65,
          height: size * 0.12,
          borderRadius: 999,
          backgroundColor: '#07454B',
          opacity: 0.08,
          transform: [{ scaleY: 0.5 }],
        }}
      />

      {/* Main Living Orb Sphere */}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          transform: [{ scale: pulseAnim }],
          shadowColor: state === 'listening' ? '#FF7A63' : '#F8B74C',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
          elevation: 12,
          overflow: 'hidden',
          backgroundColor: '#FF6B57',
        }}
      >
        {/* Soft Radial Gradient / Mesh Illusion Layers */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FF7A63',
          }}
        />

        {/* Top-left warm butter highlight */}
        <View
          style={{
            position: 'absolute',
            top: -size * 0.15,
            left: -size * 0.15,
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: 999,
            backgroundColor: '#FFF0CF',
            opacity: 0.7,
          }}
        />

        {/* Bottom-right peach aura */}
        <View
          style={{
            position: 'absolute',
            bottom: -size * 0.2,
            right: -size * 0.2,
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: 999,
            backgroundColor: '#FFB89A',
            opacity: 0.6,
          }}
        />

        {/* Center glowing core */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.18,
            left: size * 0.18,
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: 999,
            backgroundColor: '#FFFFFF',
            opacity: 0.45,
          }}
        />
      </Animated.View>
    </View>
  );
};
