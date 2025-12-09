import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SectionList,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { familyViewModel, authViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';
import { useRouter } from 'expo-router';

/**
 * CalendarScreen - Shared calendar and event planning
 * 
 * UC-302: SHARED CALENDAR & PLANS
 * Displays all events organized by date
 * Allows creating, editing, and deleting events
 * Shows AI recommendations section
 * 
 * FR 3.2.1 - 3.2.13
 */
export const CalendarScreen = observer(() => {
  const router = useRouter();
  const { calendarEvents, errorMessage, successMessage, canAccessCalendar } = familyViewModel;

  useEffect(() => {
    const initializeIfNeeded = async () => {
      if (!familyViewModel.currentRelationship) {
        const userId = authViewModel.authState.currentUserId;
        if (userId) {
          await familyViewModel.initialize(userId);
        }
      }
      if (familyViewModel.currentRelationship) {
        familyViewModel.loadCalendarEvents(familyViewModel.currentRelationship.id);
      }
    };
    initializeIfNeeded();
  }, [familyViewModel.currentRelationship?.id]);

  if (!canAccessCalendar()) {
    return (
      <View style={styles.lockedContainer}>
        <Header title="Shared Calendar" />
        <View style={styles.lockedContent}>
          <ThemedText style={styles.lockedText}>
            Shared Calendar is available from Stage 2 onwards
          </ThemedText>
        </View>
      </View>
    );
  }

  const handleCreateEvent = () => {
    router.push('/family/calendar/create-event');
  };

  const handleSelectEvent = (eventId: string) => {
    router.push({
      pathname: '/family/calendar/event-detail',
      params: { eventId },
    });
  };

  const handleViewRecommendations = () => {
    router.push('/family/calendar/ai-recommendations');
  };

  const renderEventItem = ({ item }: { item: any }) => {
    const eventDate = new Date(item.event_date);
    const isUpcoming = eventDate >= new Date();

    return (
      <TouchableOpacity
        style={[styles.eventCard, !isUpcoming && styles.pastEvent]}
        onPress={() => handleSelectEvent(item.id)}
      >
        <View style={styles.eventDate}>
          <ThemedText style={styles.eventMonth}>
            {eventDate.toLocaleDateString('default', { month: 'short' })}
          </ThemedText>
          <ThemedText style={styles.eventDay}>
            {eventDate.getDate()}
          </ThemedText>
        </View>

        <View style={styles.eventInfo}>
          <ThemedText style={styles.eventTitle} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText style={styles.eventType}>
            {item.event_type.charAt(0).toUpperCase() + item.event_type.slice(1)}
          </ThemedText>
          {item.event_time && (
            <ThemedText style={styles.eventTime}>{item.event_time}</ThemedText>
          )}
          {item.location && (
            <ThemedText style={styles.eventLocation} numberOfLines={1}>
              📍 {item.location}
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Group events by date
  const groupedEvents = calendarEvents.reduce((acc: any, event: any) => {
    const dateKey = new Date(event.event_date).toLocaleDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  const sections = Object.entries(groupedEvents)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, events]: [string, any]) => ({
      title: date,
      data: events,
    }));

  return (
    <View style={styles.container}>
      <Header title="Shared Calendar" />

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
        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Button
            title="Create Event"
            onPress={handleCreateEvent}
            variant="primary"
          />
          <Button
            title="AI Recommendations"
            onPress={handleViewRecommendations}
            variant="outline"
          />
        </View>

        {/* Events List */}
        {calendarEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No events yet. Create your first event or check AI recommendations!
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={calendarEvents}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}
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
  actionSection: {
    gap: 12,
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 32,
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9DE2D0',
  },
  pastEvent: {
    opacity: 0.6,
    borderLeftColor: '#CCCCCC',
  },
  eventDate: {
    width: 50,
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  eventMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9DE2D0',
    textTransform: 'uppercase',
  },
  eventDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#11181C',
  },
  eventInfo: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
  },
  eventType: {
    fontSize: 12,
    color: '#9DE2D0',
    marginTop: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#687076',
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#687076',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
    color: '#687076',
    fontSize: 16,
  },
  lockedContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedText: {
    textAlign: 'center',
    color: '#687076',
    fontSize: 18,
  },
});
