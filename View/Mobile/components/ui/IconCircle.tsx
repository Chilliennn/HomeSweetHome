import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface IconCircleProps {
  icon?: string;  // emoji
  imageSource?: any;  // require() image
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const IconCircle: React. FC<IconCircleProps> = ({
  icon,
  imageSource,
  size = 80,
  backgroundColor = '#7ECEC5',
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
          backgroundColor,
        },
        style,
      ]}
    >
      {icon && <Text style={[styles.icon, { fontSize: size * 0.4 }]}>{icon}</Text>}
      {imageSource && (
        <Image
          source={imageSource}
          style={{ width: size * 0.6, height: size * 0.6 }}
          contentFit="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});

export default IconCircle;