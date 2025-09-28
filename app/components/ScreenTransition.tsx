import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Props = PropsWithChildren<{
  dependency: string;
  backgroundColor?: string;
}>;

const ScreenTransition: React.FC<Props> = ({ dependency, backgroundColor = '#05030A', children }) => {
  const translateX = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateX.setValue(24);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dependency, opacity, translateX]);

  return (
    <View style={[styles.outer, { backgroundColor }]}> 
      <Animated.View style={[styles.container, { opacity, transform: [{ translateX }] }]}> 
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
