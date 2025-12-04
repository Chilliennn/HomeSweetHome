import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { IconCircle } from './IconCircle';

interface InfoCardProps {
  icon?: string;
  imageSource?: any;
  title: string;
  description: string;
  style?: ViewStyle;
  backgroundColor?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  imageSource,
  title,
  description,
  style,
  backgroundColor = '#F5F5F5',
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <IconCircle
        icon={icon}
        imageSource={imageSource}
        size={60}
        backgroundColor="#7ECEC5"
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet. create({
  container: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default InfoCard;