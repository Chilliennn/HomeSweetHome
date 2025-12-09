import React, { useState, useEffect } from 'react';
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
import { familyViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { EventType } from '@home-sweet-home/model';

const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'meetup', label: 'Meetup', emoji: '👋' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'anniversary', label: 'Anniversary', emoji: '💝' },
  { value: 'activity', label: 'Activity', emoji: '🎯' },
  { value: 'other', label: 'Other', emoji: '📅' },
];

/**
 * EventDetailScreen - View and manage individual calendar event
 * 
 * UC-302: Event details, editing, and deletion
 * Shows full event details, allows editing and deletion with confirmation
 * 
 * FR 3.2.1, 3.2.8, 3.2.9, 3.2.11, 3.2.12
 */
export const EventDetailScreen = observer(() => {
  const router = useRouter();
  const { eventId } = useLocalSearchParams();
  const { selectedEvent, isLoading, errorMessage, successMessage } = familyViewModel;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventType, setEditEventType] = useState<EventType>('meetup');
  const [editEventDate, setEditEventDate] = useState(new Date());
  const [editEventTime, setEditEventTime] = useState(new Date());
  const [editLocation, setEditLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    // Load event by ID when component mounts
    if (eventId && typeof eventId === 'string') {
      familyViewModel.loadCalendarEvent(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (selectedEvent) {
      setEditTitle(selectedEvent.title);
      setEditDescription(selectedEvent.description || '');
      setEditEventType(selectedEvent.event_type);
      setEditEventDate(new Date(selectedEvent.event_date));
      setEditLocation(selectedEvent.location || '');

      if (selectedEvent.event_time) {
        const [hours, minutes] = selectedEvent.event_time.split(':');
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours), parseInt(minutes));
        setEditEventTime(timeDate);
      }
    }
  }, [selectedEvent]);

  if (!selectedEvent) {
    return (
      <View style={styles.container}>
        <Header title="Event Details" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading event...</ThemedText>
        </View>
      </View>
    );
  }

  const getEventTypeInfo = (type: EventType) => {
    return EVENT_TYPES.find(t => t.value === type);
  };

  const handleDateChange = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditEventDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime: any) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setEditEventTime(selectedTime);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Event title is required');
      return;
    }

    const timeString = editEventTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    await familyViewModel.updateCalendarEvent(selectedEvent.id, {
      title: editTitle,
      description: editDescription || undefined,
      event_type: editEventType,
      event_date: editEventDate.toISOString().split('T')[0],
      event_time: timeString,
      location: editLocation || undefined,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone!',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            await familyViewModel.deleteCalendarEvent(selectedEvent.id);
            router.back();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const eventTypeInfo = getEventTypeInfo(selectedEvent.event_type);

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit Event' : 'Event Details'}
        showBackButton={true}
      />

      {errorMessage && (
        <AlertBanner
          type="error"
          message={errorMessage}
          onDismiss={() => familyViewModel.clearError()}
        />
      )}

      {successMessage && (
        <AlertBanner
          type="success"
          message={successMessage}
          onDismiss={() => familyViewModel.clearSuccessMessage()}
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Header */}
        <View style={styles.headerSection}>
          {isEditing ? (
            <View style={styles.typeEditContainer}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    editEventType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setEditEventType(type.value)}
                >
                  <ThemedText style={styles.typeEmoji}>{type.emoji}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.typeDisplay}>
              <ThemedText style={styles.typeEmoji}>{eventTypeInfo?.emoji}</ThemedText>
              <ThemedText style={styles.typeLabel}>{eventTypeInfo?.label}</ThemedText>
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Title</ThemedText>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              maxLength={100}
            />
          ) : (
            <ThemedText style={styles.value}>{selectedEvent.title}</ThemedText>
          )}
        </View>

        {/* Date */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Date</ThemedText>
          {isEditing ? (
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText style={styles.dateTimeText}>
                {editEventDate.toLocaleDateString()}
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedText style={styles.value}>
              {new Date(selectedEvent.event_date).toLocaleDateString()}
            </ThemedText>
          )}
          {showDatePicker && (
            <DateTimePicker
              value={editEventDate}
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
          {isEditing ? (
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <ThemedText style={styles.dateTimeText}>
                {editEventTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedText style={styles.value}>
              {selectedEvent.event_time || 'No time set'}
            </ThemedText>
          )}
          {showTimePicker && (
            <DateTimePicker
              value={editEventTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Location</ThemedText>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editLocation}
              onChangeText={setEditLocation}
              maxLength={100}
            />
          ) : (
            <ThemedText style={styles.value}>
              {selectedEvent.location || 'No location set'}
            </ThemedText>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Description</ThemedText>
          {isEditing ? (
            <View>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                maxLength={500}
              />
              <ThemedText style={styles.characterCount}>
                {editDescription.length}/500
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.value}>
              {selectedEvent.description || 'No description'}
            </ThemedText>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <>
              <Button
                title="Cancel"
                onPress={() => setIsEditing(false)}
                variant="outline"
              />
              <Button
                title="Save Changes"
                onPress={handleSaveEdit}
                loading={isLoading}
                variant="primary"
              />
            </>
          ) : (
            <>
              <Button
                title="Edit"
                onPress={() => setIsEditing(true)}
                variant="primary"
              />
              <Button
                title="Delete"
                onPress={handleDelete}
                variant="outline"
              />
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  typeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeEmoji: {
    fontSize: 32,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  typeEditContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    width: '30%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButtonActive: {
    backgroundColor: '#9DE2D0',
    borderColor: '#9DE2D0',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: '#11181C',
    lineHeight: 20,
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
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  actionButtons: {
    gap: 12,
    marginVertical: 24,
  },
});
