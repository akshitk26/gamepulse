import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

const FloatingOrbs: React.FC = () => {
  const animA = useRef(new Animated.Value(0)).current;
  const animB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const runLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 9000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 9000,
            useNativeDriver: true,
          }),
        ]),
      ).start();

    runLoop(animA, 0);
    runLoop(animB, 4500);
  }, [animA, animB]);

  const translateOrb = (value: Animated.Value, xRange: number[], yRange: number[]) => ({
    transform: [
      { translateX: value.interpolate({ inputRange: [0, 1], outputRange: xRange }) },
      { translateY: value.interpolate({ inputRange: [0, 1], outputRange: yRange }) },
    ],
  });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.orb, styles.orbPurple, translateOrb(animA, [0, -18], [0, 24])]} />
      <Animated.View
        pointerEvents="none"
        style={[styles.orb, styles.orbGreen, translateOrb(animB, [0, 22], [0, -18])]} />
    </>
  );
};

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 260,
    opacity: 0.65,
  },
  orbPurple: {
    top: -120,
    right: -80,
    backgroundColor: 'rgba(113, 64, 255, 0.32)',
  },
  orbGreen: {
    bottom: -140,
    left: -110,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: 'rgba(28, 231, 131, 0.25)',
  },
});

export default FloatingOrbs;
