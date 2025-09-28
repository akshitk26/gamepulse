import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

const FloatingOrbs: React.FC = () => {
  const animA = useRef(new Animated.Value(0)).current;
  const animB = useRef(new Animated.Value(0)).current;
  const animC = useRef(new Animated.Value(0)).current;
  const rotationA = useRef(new Animated.Value(0)).current;
  const rotationB = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;
  const scaleB = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const runFloatLoop = (value: Animated.Value, delay: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();

    const runRotationLoop = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

    const runScaleLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1.1,
            duration: 6000,
            delay,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 1,
            duration: 6000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();

    // Floating animations with different speeds
    runFloatLoop(animA, 0, 8000);
    runFloatLoop(animB, 2000, 12000);
    runFloatLoop(animC, 4000, 10000);
    
    // Rotation animations
    runRotationLoop(rotationA, 40000);
    runRotationLoop(rotationB, 60000);
    
    // Scale pulsing
    runScaleLoop(scaleA, 0);
    runScaleLoop(scaleB, 3000);
  }, [animA, animB, animC, rotationA, rotationB, scaleA, scaleB]);

  const createOrbTransform = (
    floatAnim: Animated.Value,
    rotationAnim: Animated.Value,
    scaleAnim: Animated.Value,
    xRange: number[],
    yRange: number[]
  ) => ({
    transform: [
      { translateX: floatAnim.interpolate({ inputRange: [0, 1], outputRange: xRange }) },
      { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: yRange }) },
      { rotate: rotationAnim.interpolate({ 
        inputRange: [0, 1], 
        outputRange: ['0deg', '360deg'] 
      }) },
      { scale: scaleAnim },
    ],
  });

  return (
    <>
      {/* Main purple orb */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orb, 
          styles.orbPurple, 
          createOrbTransform(animA, rotationA, scaleA, [0, -25], [0, 30])
        ]} 
      />
      
      {/* Main green orb */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orb, 
          styles.orbGreen, 
          createOrbTransform(animB, rotationB, scaleB, [0, 30], [0, -25])
        ]} 
      />
      
      {/* Additional small accent orb */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orb, 
          styles.orbAccent, 
          createOrbTransform(animC, rotationA, scaleA, [0, -15], [0, 20])
        ]} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 280,
    opacity: 0.4,
  },
  orbPurple: {
    top: -140,
    right: -80,
    backgroundColor: 'rgba(113, 64, 255, 0.35)',
    shadowColor: 'rgba(113, 64, 255, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  orbGreen: {
    bottom: -160,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(28, 231, 131, 0.2)',
    shadowColor: 'rgba(28, 231, 131, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
  },
  orbAccent: {
    top: '60%',
    right: '20%',
    width: 120,
    height: 120,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    shadowColor: 'rgba(255, 215, 0, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
});

export default FloatingOrbs;
