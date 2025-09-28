import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import BouncyPressable from './BouncyPressable';

const GlowButton: React.FC<PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
}>> = ({ children, style, onPress, disabled }) => {
  return (
    <BouncyPressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.wrapper, disabled && styles.wrapperDisabled, style]}
    >
      <View style={styles.inner}>{children}</View>
    </BouncyPressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(113, 64, 255, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(113, 64, 255, 0.45)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#7140FF',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 6,
  },
  wrapperDisabled: {
    opacity: 0.6,
  },
  inner: {
    alignItems: 'center',
  },
});

export default GlowButton;
