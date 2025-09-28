import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

const FadeSlideIn: React.FC<PropsWithChildren<{ style?: StyleProp<ViewStyle> }>> = ({ children, style }) => {
  const translateY = useRef(new Animated.Value(28)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity }]}>
      {children}
    </Animated.View>
  );
};

export default FadeSlideIn;
