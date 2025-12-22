import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { familyViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';
import type { EventType } from '@home-sweet-home/model';

const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'meetup', label: 'Meetup', emoji: '👋' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'anniversary', label: 'Anniversary', emoji: '💝' },
  { value: 'activity', label: 'Activity', emoji: '🎯' },
  { value: 'other', label: 'Other', emoji: '📅' },
];

/**
 * CreateEventScreen - Create new calendar event
 * 
 * UC-302: Create, edit, and delete calendar events
 * Allows setting event details, date, time, location
 * Validates future date
 * 
 */
export const CreateEventScreen = observer(() => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentRelationship, isLoading, errorMessage } = familyViewModel;

  // Get userId from route params or familyViewModel
  const userId = (params.userId as string) || familyViewModel.currentUserId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('meetup');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime: any) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Check if selected time is in the past (if date is today)
      const today = new Date();
      const isToday = eventDate.toDateString() === today.toDateString();
      
      if (isToday && selectedTime < today) {
        Alert.alert('Error', 'Cannot select a past time');
        return;
      }
      
      setEventTime(selectedTime);
    }
  };

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Event title is required');
      return;
    }

    if (!currentRelationship) {
      Alert.alert('Error', 'No active relationship');
      return;
    }

    // Validate that the combined date and time is not in the past
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(eventTime.getHours());
    eventDateTime.setMinutes(eventTime.getMinutes());
    eventDateTime.setSeconds(eventTime.getSeconds());

    if (eventDateTime < now) {
      Alert.alert('Error', 'Event date and time cannot be in the past');
      return;
    }

    // Format time as HH:MM:SS for PostgreSQL time type
    const hours = String(eventTime.getHours()).padStart(2, '0');
    const minutes = String(eventTime.getMinutes()).padStart(2, '0');
    const seconds = String(eventTime.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    // ✅ MVVM: Use familyViewModel.currentUserId (synced from Layout)
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    await familyViewModel.createCalendarEvent(
      currentRelationship.id,
      userId,
      title,
      eventType,
      eventDate.toISOString().split('T')[0],
      timeString,
      description || undefined,
      location || undefined
    );

    if (!familyViewModel.errorMessage) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Create Event"
        showBackButton={true}
      />

      {errorMessage && (
        <AlertBanner
          type="error"
          message={errorMessage}
          onDismiss={() => familyViewModel.clearError()}
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Type Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Event Type</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeContainer}
          >
            {EVENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  eventType === type.value && styles.typeButtonActive,
                ]}
                onPress={() => setEventType(type.value)}
              >
                <ThemedText style={styles.typeEmoji}>{type.emoji}</ThemedText>
                <ThemedText style={styles.typeLabel}>{type.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Event Title *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Enter event title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Date */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Date *</ThemedText>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <ThemedText style={styles.dateTimeText}>
              {eventDate.toLocaleDateString()}
            </ThemedText>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={eventDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Time */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Time</ThemedText>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <ThemedText style={styles.dateTimeText}>
              {eventTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </ThemedText>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={eventTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Location</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Enter location"
            placeholderTextColor="#999"
            value={location}
            onChangeText={setLocation}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Description</ThemedText>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Add details about this event"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
          <ThemedText style={styles.characterCount}>
            {description.length}/500
          </ThemedText>
        </View>

        {/* Create Button */}
        <View style={styles.actionButtons}>
          <Button
            title={isLoading ? 'Creating...' : 'Create Event'}
            onPress={handleCreateEvent}
            disabled={!title.trim() || isLoading}
            loading={isLoading}
            variant="primary"
          />
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  typeContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  typeButton: {
    alignItems: 'center',
    marginRight: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButtonActive: {
    backgroundColor: '#9DE2D0',
    borderColor: '#9DE2D0',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 11,
    color: '#687076',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#11181C',
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#11181C',
    fontWeight: '500',
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  actionButtons: {
    marginVertical: 24,
  },
});
