import React, { PropsWithChildren, useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleSheet } from 'react-native';

const BouncyPressable: React.FC<PropsWithChildren<PressableProps>> = ({ children, style, ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  };

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        rest.onPressIn?.(e);
        animateTo(0.95);
      }}
      onPressOut={(e) => {
        rest.onPressOut?.(e);
        animateTo(1);
      }}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
});

export default BouncyPressable;
