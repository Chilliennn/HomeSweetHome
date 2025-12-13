import React from 'react';
import { SettingsScreen } from '../../AuthUI';

/**
 * Settings Route: /(main)/settings
 * 
 * Wraps the SettingsScreen component from AuthUI.
 * Handles user settings, profile management, notifications, and logout.
 */
export default function SettingsRoute() {
  return <SettingsScreen />;
}