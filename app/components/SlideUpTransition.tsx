import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = PropsWithChildren<{
  isVisible: boolean;
  backgroundColor?: string;
  duration?: number;
}>;

const SlideUpTransition: React.FC<Props> = ({ 
  isVisible, 
  backgroundColor = 'transparent', 
  children, 
  duration = 500 
}) => {
  const translateY = useRef(new Animated.Value(isVisible ? 0 : 50)).current;
  const opacity = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(isVisible ? 1 : 0.95)).current;

  useEffect(() => {
    const targetY = isVisible ? 0 : 50;
    const targetOpacity = isVisible ? 1 : 0;
    const targetScale = isVisible ? 1 : 0.95;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: targetY,
        duration,
        easing: isVisible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: targetOpacity,
        duration: duration * 0.8,
        easing: isVisible ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: targetScale,
        duration,
        easing: isVisible ? Easing.out(Easing.back(1.05)) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isVisible, translateY, opacity, scale, duration]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[
        styles.content,
        {
          opacity,
          transform: [{ translateY }, { scale }]
        }
      ]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default SlideUpTransition;