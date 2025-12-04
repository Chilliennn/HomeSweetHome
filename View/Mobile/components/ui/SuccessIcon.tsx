import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface SuccessIconProps {
  size?: number;
  style?: ViewStyle;
}

export const SuccessIcon: React.FC<SuccessIconProps> = ({
  size = 120,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.checkmark, { fontSize: size * 0.5 }]}>✓</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#7ECEC5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default SuccessIcon;