import React, { PropsWithChildren, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

const BouncyPressable: React.FC<PropsWithChildren<PressableProps>> = ({ children, style, ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 180,
      damping: 15,
    }).start();
  };

  const styleFn = useMemo(() => {
    return (state: PressableStateCallbackType): StyleProp<ViewStyle> => {
      const base = typeof style === 'function' ? style(state) : style;
      return [base, state.pressed && styles.pressed];
    };
  }, [style]);

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        rest.onPressIn?.(e);
        animateTo(0.97);
      }}
      onPressOut={(e) => {
        rest.onPressOut?.(e);
        animateTo(1);
      }}
      style={styleFn}
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
