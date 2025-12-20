import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { elderMatchingViewModel, youthMatchingViewModel, matchingViewModel } from '@home-sweet-home/viewmodel';
import { notificationRepository } from '@home-sweet-home/model';
import { NotificationItem, LoadingSpinner } from '@/components/ui';
import { Colors } from '@/constants/theme';

// Helper for date formatting
const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Map database notification types to NotificationItem types
const mapNotificationType = (dbType: string): 'interest_sent' | 'interest_declined' | 'interest_accepted' | 'interest_received' | 'application_submitted' | 'message' | 'reminder' | 'system' => {
    const typeMap: Record<string, any> = {
        'interest_sent': 'interest_sent',
        'new_interest': 'interest_received',          // DB: new_interest -> UI: interest_received
        'interest_received': 'interest_received',
        'interest_accepted': 'interest_accepted',
        'interest_rejected': 'interest_declined',     // DB: interest_rejected -> UI: interest_declined
        'interest_declined': 'interest_declined',
        'application_submitted': 'application_submitted',
        'new_message': 'message',
        'calendar_reminder': 'reminder',
        'stage_milestone': 'system',
        'admin_notice': 'system',
        'consultation_assigned': 'system',
        'advisor_assigned': 'system',
        'application_update': 'system',
        'safety_alert': 'reminder',
    };
    return typeMap[dbType] || 'system';
};

export const NotificationScreen = observer(() => {
    const router = useRouter();

    // View Models
    const matchVM = elderMatchingViewModel;
    const youthVM = youthMatchingViewModel;
    const rootMatchVM = matchingViewModel;

    const currentUserId = rootMatchVM.currentUserId;
    const isElderly = rootMatchVM.currentUserType === 'elderly';

    // State for general system notifications (calendar, memories, etc.)
    const [generalNotifications, setGeneralNotifications] = useState<any[]>([]);
    const [isLoadingGeneral, setIsLoadingGeneral] = useState(false);

    // Load notifications based on user type
    useEffect(() => {
        if (currentUserId) {
            if (isElderly) {
                matchVM.loadRequests(currentUserId);
            } else {
                youthVM.loadNotifications(currentUserId);
            }

            // Load general notifications (calendar, memories, etc.)
            loadGeneralNotifications(currentUserId);
        }
        return () => {
            if (isElderly) {
                matchVM.dispose();
            } else {
                youthVM.dispose();
            }
        };
    }, [isElderly, currentUserId]);

    // Load general notifications from notifications table
    const loadGeneralNotifications = async (userId: string) => {
        setIsLoadingGeneral(true);
        try {
            console.log('[NotificationScreen] Loading general notifications for user:', userId);
            const notifications = await notificationRepository.getNotifications(userId, 50);
            console.log('[NotificationScreen] All notifications:', notifications.length);
            setGeneralNotifications(notifications);
        } catch (error) {
            console.error('[NotificationScreen] Failed to load general notifications:', error);
        } finally {
            setIsLoadingGeneral(false);
        }
    };

    // Setup real-time subscription for general notifications
    useEffect(() => {
        if (!currentUserId) return;

        const subscription = notificationRepository.subscribeToNotifications(
            currentUserId,
            (notification) => {
                console.log('[NotificationScreen] New notification received:', notification);
                loadGeneralNotifications(currentUserId);
            }
        );

        return () => {
            notificationRepository.unsubscribe(subscription);
        };
    }, [currentUserId]);

    // Mark notification as read when tapped
    const handleNotificationPress = async (notificationId: string) => {
        try {
            await notificationRepository.markAsRead(notificationId);
            // Update local state to reflect the change
            setGeneralNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('[NotificationScreen] Failed to mark as read:', error);
        }
    };

    // Accept interest (elderly action)
    const handleAccept = async (reqId: string, youthId: string) => {
        if (!currentUserId) return;
        await matchVM.respondToInterest(reqId, youthId, currentUserId, true);
        console.log('[NotificationScreen] after respondToInterest', {
            successMessage: matchVM.successMessage,
            error: matchVM.error,
        });
        if (matchVM.successMessage) Alert.alert("Success", matchVM.successMessage);
        else if (matchVM.error) Alert.alert("Error", matchVM.error);
    };

    // View youth profile (elderly action)
    const handleViewProfile = (applicationId: string) => {
        router.push(`/(main)/youth-profile?applicationId=${applicationId}`);
    };

    // Navigate to PreMatchStarted screen when youth taps accepted notification
    const handleMatchClick = (matchId: string) => {
        router.push(`/(main)/pre-match-started?matchId=${matchId}`);
    };

    // Delete interest request (elderly action)
    const handleDeleteRequest = async (requestId: string) => {
        Alert.alert(
            'Delete Request',
            'Are you sure you want to delete this interest request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await matchVM.deleteRequest(requestId);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete request');
                        }
                    },
                },
            ]
        );
    };

    // Delete general notification
    const handleDeleteNotification = async (notificationId: string) => {
        try {
            await notificationRepository.deleteNotification(notificationId);
            setGeneralNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('[NotificationScreen] Failed to delete notification:', error);
            Alert.alert('Error', 'Failed to delete notification');
        }
    };

    /**
     * Render: Incoming Interest Request (Elderly)
     * Uses NotificationItem with expandable feature
     */
    const renderElderlyNotification = ({ item }: { item: any }) => {
        const youthName = item.youth?.full_name || 'Anonymous Youth';
        const youthAge = item.youth?.profile_data?.verified_age || '18+';
        const youthLocation = item.youth?.location || 'Unknown';
        const youthInterests = item.youth?.profile_data?.interests || [];
        const motivation = item.motivation_letter || 'No message provided';

        return (
            <NotificationItem
                type="interest_received"
                title="Interest Received"
                message={`${youthName} is interested in becoming your companion`}
                highlightName={youthName}
                timestamp={formatDate(item.applied_at || item.created_at)}
                expandable={true}
                expandedContent={{
                    profileName: youthName,
                    profileInfo: `${youthAge} years old`,
                    location: youthLocation,
                    interests: youthInterests,
                    motivation: motivation,
                }}
                actions={{
                    onAccept: () => handleAccept(item.id, item.youth_id),
                    onViewProfile: () => handleViewProfile(item.id),
                }}
                isLoading={matchVM.isLoading}
                onDelete={() => handleDeleteRequest(item.id)}
            />
        );
    };

    /**
     * Render: Match Update / System Notification (Youth)
     * Uses NotificationItem
     */
    const renderYouthNotification = ({ item }: { item: any }) => {
        const isAccepted = item.status === 'pre_chat_active';
        const elderlyName = item.elderly?.full_name || 'An Elderly';
        const date = formatDate(item.reviewed_at || item.created_at);

        if (isAccepted) {
            return (
                <NotificationItem
                    type="interest_accepted"
                    title="Interest Accepted! 🎉"
                    message={`${elderlyName} accepted your interest. Tap to start chatting!`}
                    highlightName={elderlyName}
                    timestamp={date}
                    showArrow={true}
                    onPress={() => handleMatchClick(item.id)}
                />
            );
        } else {
            return (
                <NotificationItem
                    type="interest_declined"
                    title="Update on Interest"
                    message={`${elderlyName} has declined your request. Keep browsing!`}
                    highlightName={elderlyName}
                    timestamp={date}
                />
            );
        }
    };

    /**
     * Render: General System Notifications
     * Simple notifications (calendar, memories, system messages)
     */
    const renderGeneralNotification = (item: any) => {
        const date = formatDate(item.created_at);
        const type = mapNotificationType(item.type);

        return (
            <NotificationItem
                key={item.id}
                type={type}
                title={item.title || 'Notification'}
                message={item.message || ''}
                timestamp={date}
                isRead={item.is_read}
                onPress={() => handleNotificationPress(item.id)}
                onDelete={() => handleDeleteNotification(item.id)}
            />
        );
    };

    const isLoading = isElderly ? matchVM.isLoading : youthVM.isLoading;
    const matchData = isElderly ? matchVM.incomingRequests : youthVM.activeMatches;

    // Loading State
    if (isLoading && matchData.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Notifications</Text>
                </View>
                <View style={styles.centerContent}>
                    <LoadingSpinner size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
            </View>

            <FlatList
                data={matchData}
                renderItem={isElderly ? renderElderlyNotification : renderYouthNotification}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={() => {
                    // Filter out interest_received notifications for elderly (already shown in matchData)
                    const filteredNotifications = isElderly
                        ? generalNotifications.filter(n => n.type !== 'new_interest' && n.type !== 'interest_received')
                        : generalNotifications;

                    return (
                        <View>
                            {/* General Notifications Section */}
                            {filteredNotifications.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>🔔 Recent Activity</Text>
                                    {filteredNotifications.map(item => renderGeneralNotification(item))}
                                </View>
                            )}

                            {/* Match Notifications Section Header */}
                            {matchData.length > 0 && (
                                <Text style={styles.sectionTitle}>
                                    {isElderly ? '❤️ Interest Requests' : '📬 Match Updates'}
                                </Text>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    generalNotifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.placeholder}>No new notifications.</Text>
                            <Text style={styles.placeholderSub}>
                                {isElderly
                                    ? "When youth express interest, they will appear here."
                                    : "Updates on your interests will appear here."}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    backIcon: {
        fontSize: 24,
        color: '#333',
        marginRight: 16
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333'
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    list: {
        padding: 16
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50
    },
    placeholder: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
        marginBottom: 8
    },
    placeholderSub: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});

