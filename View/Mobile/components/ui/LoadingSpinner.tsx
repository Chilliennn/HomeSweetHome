import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';

interface LoadingSpinnerProps {
  title?: string;
  message?: string;
  style?: ViewStyle;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  title,
  message,
  style,
  size = 'large',
  color = '#7ECEC5',
}) => {
  return (
    <View style={[styles. container, style]}>
      <View style={styles.spinnerBox}>
        <ActivityIndicator size={size} color={color} />
        {title && <Text style={styles.title}>{title}</Text>}
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinnerBox: {
    backgroundColor: '#7ECEC5',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    minWidth: 200,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 20,
  },
  message: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
});

export default LoadingSpinner;