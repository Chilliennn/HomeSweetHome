import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface ChecklistItemProps {
  number: number;
  title: string;
  description: string;
  style?: ViewStyle;
  showDivider?: boolean;
}

export const ChecklistItem: React. FC<ChecklistItemProps> = ({
  number,
  title,
  description,
  style,
  showDivider = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <View style={styles.numberCircle}>
          <Text style={styles.numberText}>{number}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 12,
    marginLeft: 48,
  },
});

export default ChecklistItem;