import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = PropsWithChildren<{
  dependency: string;
  backgroundColor?: string;
}>;

const ScreenTransition: React.FC<Props> = ({ dependency, backgroundColor = '#05030A', children }) => {
  const translateX = useRef(new Animated.Value(16)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    translateX.setValue(12);
    opacity.setValue(0);
    scale.setValue(0.96);
    
    // Stagger the animations for a more natural feel
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scale, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.back(1.08)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [dependency, opacity, translateX, scale]);

  return (
    <View style={[styles.outer, { backgroundColor }]}> 
      <Animated.View style={[styles.container, { 
        opacity, 
        transform: [{ translateX }, { scale }] 
      }]}> 
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});

export default ScreenTransition;
