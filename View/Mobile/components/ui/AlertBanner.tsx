import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type AlertType = 'warning' | 'info' | 'success' | 'error';

interface AlertBannerProps {
    type: AlertType;
    message: string;
    icon?: string;
    style?: ViewStyle;
}

const ALERT_COLORS = {
  warning: { bg: '#FFF3CD', text: '#856404', border: '#FFEEBA' },
  info: { bg: '#D1ECF1', text: '#0C5460', border: '#BEE5EB' },
  success: { bg: '#D4EDDA', text: '#155724', border: '#C3E6CB' },
  error: { bg: '#F8D7DA', text: '#721C24', border: '#F5C6CB' },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  message,
  icon,
  style,
}) => {
  const colors = ALERT_COLORS[type];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }, style]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.message, { color: colors.text }]}>
        {type === 'warning' && ! icon && '⚠️ '}
        {type === 'info' && !icon && '🔒 '}
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AlertBanner;