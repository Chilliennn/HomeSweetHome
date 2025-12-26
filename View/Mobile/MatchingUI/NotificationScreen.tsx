import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { elderMatchingViewModel, youthMatchingViewModel, matchingViewModel } from '@home-sweet-home/viewmodel';
import { NotificationItem, LoadingSpinner } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getAvatarDisplay } from '@/hooks';

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
        'new_interest': 'interest_received',          
        'interest_accepted': 'interest_accepted',
        'interest_rejected': 'interest_declined',    
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

            //  Load general notifications via ViewModel
            loadGeneralNotifications();
            
            //  Mark all as read when entering page
            markAllAsRead();
        }
        return () => {
            if (isElderly) {
                matchVM.dispose();
            } else {
                youthVM.dispose();
            }
        };
    }, [isElderly, currentUserId]);

    //  Load general notifications via ViewModel (MVVM compliant)
    const loadGeneralNotifications = async () => {
        setIsLoadingGeneral(true);
        try {
            const vm = isElderly ? matchVM : youthVM;
            const notifications = await vm.getGeneralNotifications();
            setGeneralNotifications(notifications);
        } catch (error) {
            console.error('[NotificationScreen] Failed to load general notifications:', error);
        } finally {
            setIsLoadingGeneral(false);
        }
    };

    // Mark all notifications as read via ViewModel (MVVM compliant)
    const markAllAsRead = async () => {
        try {
            const vm = isElderly ? matchVM : youthVM;
            await vm.markAllNotificationsAsRead();
            console.log('[NotificationScreen] ✅ All notifications marked as read');
        } catch (error) {
            console.error('[NotificationScreen] Failed to mark all as read:', error);
        }
    };

    // Setup real-time subscription for general notifications via ViewModel
    useEffect(() => {
        if (!currentUserId) return;

        const vm = isElderly ? matchVM : youthVM;
        // Subscribe via ViewModel 
        const subscription = vm.subscribeToGeneralNotifications((notification) => {
            console.log('[NotificationScreen] New notification received:', notification);
            loadGeneralNotifications();
        });

        return () => {
            // Unsubscribe via ViewModel
            vm.unsubscribeFromNotifications(subscription);
        };
    }, [currentUserId, isElderly]);

    // Mark notification as read when tapped 
    const handleNotificationPress = async (notificationId: string) => {
        // No action needed - all marked as read on page load
        console.log('[NotificationScreen] Notification tapped:', notificationId);
    };

    // Accept interest
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

    // View youth profile 
    const handleViewProfile = (applicationId: string) => {
        router.push(`/(main)/youth-profile?applicationId=${applicationId}`);
    };

    // Navigate to PreMatchStarted screen when youth taps accepted notification
    const handleMatchClick = (matchId: string) => {
        router.push(`/(main)/pre-match-started?matchId=${matchId}`);
    };

    // Delete interest request 
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

    // Delete general notification via ViewModel (MVVM compliant)
    const handleDeleteNotification = async (notificationId: string) => {
        try {
            const vm = isElderly ? matchVM : youthVM;
            await vm.deleteNotification(notificationId);
            // Reload to update UI
            loadGeneralNotifications();
            console.log('[NotificationScreen] Notification deleted:', notificationId);
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

        // Get avatar data - priority: profile_photo_url > preset avatar
        const hasRealPhoto = !!item.youth?.profile_photo_url;
        const avatarConfig = hasRealPhoto
            ? { 
                icon: undefined, 
                imageSource: { uri: item.youth.profile_photo_url! } as { uri: string }, 
                backgroundColor: '#9DE2D0' 
              }
            : getAvatarDisplay(item.youth?.profile_data, 'youth');

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
                    avatarIcon: avatarConfig.icon,
                    avatarImageSource: avatarConfig.imageSource as { uri: string } | undefined,
                    avatarColor: avatarConfig.backgroundColor,
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
                     <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Notifications</Text>
                    <View style={styles.headerSpacer} />
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <View style={styles.headerSpacer} />
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
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#9DE2D0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 20,
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
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

