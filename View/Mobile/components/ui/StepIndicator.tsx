import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  style?: ViewStyle;
  activeColor?: string;
  inactiveColor?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  totalSteps,
  currentStep,
  style,
  activeColor = '#7ECEC5',
  inactiveColor = '#D9D9D9',
}) => {
  return (
    <View style={[styles. container, style]}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index < currentStep ? activeColor : inactiveColor,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default StepIndicator;