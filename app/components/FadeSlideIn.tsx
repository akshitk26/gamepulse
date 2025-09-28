import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

const FadeSlideIn: React.FC<PropsWithChildren<{ 
  style?: StyleProp<ViewStyle>;
  delay?: number;
}>> = ({ children, style, delay = 0 }) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.back(1.05)),
        useNativeDriver: true,
      }),
    ]);
    
    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [opacity, translateY, scale, delay]);

  return (
    <Animated.View style={[style, { 
      opacity, 
      transform: [{ translateY }, { scale }] 
    }]}>
      {children}
    </Animated.View>
  );
};

export default FadeSlideIn;
