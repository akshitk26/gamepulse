import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

const StaggeredFadeIn: React.FC<PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  index: number;
  staggerDelay?: number;
}>> = ({ children, style, index, staggerDelay = 100 }) => {
  const translateY = useRef(new Animated.Value(12)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const delay = index * staggerDelay;
    
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.back(1.02)),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, [index, staggerDelay, opacity, translateY, scale]);

  return (
    <Animated.View style={[style, {
      opacity,
      transform: [{ translateY }, { scale }]
    }]}>
      {children}
    </Animated.View>
  );
};

export default StaggeredFadeIn;