import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { elderMatchingViewModel, youthMatchingViewModel, authViewModel } from '@home-sweet-home/viewmodel';
import { Card, Button, IconCircle, LoadingSpinner } from '@/components/ui';
import { Colors } from '@/constants/theme';

// Helper for date formatting
const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const NotificationScreen = observer(() => {
    const router = useRouter();
    
    // UC102_3: Track expanded state for each elderly notification
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // View Models
    const authVM = authViewModel;
    const matchVM = elderMatchingViewModel;
    const youthVM = youthMatchingViewModel;

    const currentUser = authVM.authState;
    const isElderly = authVM.userType === 'elderly';

    // Load notifications based on user type
    useEffect(() => {
        if (currentUser.currentUserId) {
            if (isElderly) {
                matchVM.loadRequests(currentUser.currentUserId);
            } else {
                youthVM.loadNotifications(currentUser.currentUserId);
            }
        }
        return () => {
            if (isElderly) {
                matchVM.dispose();
            } else {
                youthVM.dispose();
            }
        };
    }, [isElderly, currentUser.currentUserId]);

    const handleAccept = async (reqId: string, youthId: string) => {
        if (!currentUser.currentUserId) return;
        await matchVM.respondToInterest(reqId, youthId, currentUser.currentUserId, true);
        console.log('[NotificationScreen] after respondToInterest', {
            successMessage: matchVM.successMessage,
            error: matchVM.error,
        });
        if (matchVM.successMessage) Alert.alert("Success", matchVM.successMessage);
        else if (matchVM.error) Alert.alert("Error", matchVM.error);
    };

    const handleDecline = async (reqId: string, youthId: string) => {
        if (!currentUser.currentUserId) return;
        await matchVM.respondToInterest(reqId, youthId, currentUser.currentUserId, false);
        
        if (matchVM.error) {
            Alert.alert('Error', matchVM.error);
        }
    };

    // UC102_5: Navigate to full youth profile
    const handleViewProfile = (applicationId: string) => {
        router.push(`/(main)/youth-profile?applicationId=${applicationId}`);
    };

    // UC102_3: Toggle expand/collapse for elderly notifications
    const toggleExpanded = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // UC101_4: Navigate to PreMatchStarted screen when youth taps accepted notification
    const handleMatchClick = (matchId: string) => {
        router.push(`/(main)/pre-match-started?matchId=${matchId}`);
    };

    /**
     * Render: Incoming Interest Request (Elderly)
     * UC102_3: Collapsible notification with Accept/Decline actions
     */
    const renderElderlyNotification = ({ item }: { item: any }) => {
        const youthName = item.youth?.full_name || 'Anonymous Youth';
        const youthAge = item.youth?.profile_data?.verified_age || '18+';
        const youthLocation = item.youth?.location || 'Unknown';
        const youthInterests = item.youth?.profile_data?.interests || [];
        const motivation = item.motivation_letter || 'No message provided';
        const isExpanded = expandedIds.has(item.id);

        return (
            <Card style={styles.requestCard}>
                {/* Header Section - Always Visible */}
                <TouchableOpacity 
                    onPress={() => toggleExpanded(item.id)}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardHeader}>
                        <IconCircle
                            icon="❤️"
                            size={50}
                            backgroundColor="#FDE8E8"
                        />
                        <View style={styles.headerInfo}>
                            <Text style={styles.notifTitle}>Interest Received</Text>
                            <Text style={styles.name}>
                                <Text style={styles.boldText}>{youthName}</Text> is interested in becoming your companion
                            </Text>
                            <Text style={styles.timeText}>2 hours ago</Text>
                        </View>
                        <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                    </View>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.profileSection}>
                            <IconCircle
                                icon="👤"
                                size={60}
                                backgroundColor={Colors.light.secondary}
                            />
                            <View style={styles.profileDetails}>
                                <Text style={styles.profileName}>{youthName}</Text>
                                <Text style={styles.profileInfo}>
                                    {youthAge} years old • {youthLocation}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.value}>{youthLocation}</Text>
                        </View>

                        {youthInterests.length > 0 && (
                            <View style={styles.detailRow}>
                                <Text style={styles.label}>Interests</Text>
                                <Text style={styles.value}>{youthInterests.slice(0, 3).join(', ')}</Text>
                            </View>
                        )}

                        <View style={styles.motivationSection}>
                            <Text style={styles.motivationText}>
                                "{motivation.substring(0, 120)}{motivation.length > 120 ? '...' : ''}"
                            </Text>
                        </View>

                        <View style={styles.buttonRow}>
                            <Button
                                title="View Profile"
                                onPress={() => handleViewProfile(item.id)}
                                variant="outline"
                                style={{ flex: 1 }}
                                disabled={matchVM.isLoading}
                            />
                            <Button
                                title="Accept"
                                onPress={() => handleAccept(item.id, item.youth_id)}
                                variant="primary"
                                style={{ flex: 1 }}
                                disabled={matchVM.isLoading}
                            />
                        </View>
                    </View>
                )}
            </Card>
        );
    };

    /**
     * Render: Match Update / System Notification (Youth)
     * Ref: 101_4 & 101_5 flow
     */
    const renderYouthNotification = ({ item }: { item: any }) => {
        const isAccepted = item.status === 'pre_chat_active';
        const elderlyName = item.elderly?.full_name || 'An Elderly';
        const date = item.reviewed_at ? formatDate(item.reviewed_at) : 'Just now';

        if (isAccepted) {
            return (
                <TouchableOpacity onPress={() => handleMatchClick(item.id)}>
                    <Card style={[styles.notificationCard, styles.acceptedCard]}>
                        <View style={styles.notifRow}>
                            <IconCircle icon="🎉" size={40} backgroundColor="#E8F5E9" />
                            <View style={styles.notifContent}>
                                <Text style={styles.notifTitle}>Interest Accepted!</Text>
                                <Text style={styles.notifText}>
                                    <Text style={{ fontWeight: 'bold' }}>{elderlyName}</Text> accepted your interest. Tap to start chatting!
                                </Text>
                                <Text style={styles.timeText}>{date}</Text>
                            </View>
                        </View>
                    </Card>
                </TouchableOpacity>
            );
        } else {
            return (
                <Card style={[styles.notificationCard, styles.rejectedCard]}>
                    <View style={styles.notifRow}>
                        <IconCircle icon="📪" size={40} backgroundColor="#F5F5F5" />
                        <View style={styles.notifContent}>
                            <Text style={styles.notifTitle}>Update on Interest</Text>
                            <Text style={styles.notifText}>
                                <Text style={{ fontWeight: 'bold' }}>{elderlyName}</Text> has declined your request. Keep browsing!
                            </Text>
                            <Text style={styles.timeText}>{date}</Text>
                        </View>
                    </View>
                </Card>
            );
        }
    };

    const isLoading = isElderly ? matchVM.isLoading : youthVM.isLoading;
    const data = isElderly ? matchVM.incomingRequests : youthVM.activeMatches;

    // Loading State
    if (isLoading) {
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

            <View style={styles.content}>
                <FlatList
                    data={data}
                    renderItem={isElderly ? renderElderlyNotification : renderYouthNotification}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.placeholder}>No new notifications.</Text>
                            <Text style={styles.placeholderSub}>
                                {isElderly
                                    ? "When youth express interest, they will appear here."
                                    : "Updates on your interests will appear here."}
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF9F6' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    backIcon: { fontSize: 24, color: '#333', marginRight: 16 },
    title: { fontSize: 20, fontWeight: '700', color: '#333' },
    content: { flex: 1 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20 },

    // UC102_3: Elderly Request Card (Collapsible)
    requestCard: { marginBottom: 16, padding: 0, backgroundColor: 'white', overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
    headerInfo: { marginLeft: 12, flex: 1 },
    name: { fontSize: 14, color: '#555', lineHeight: 20 },
    expandIcon: { fontSize: 14, color: '#999', marginLeft: 8 },
    boldText: { fontWeight: '600', color: '#333' },
    
    // UC102_3: Expanded Content
    expandedContent: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    profileSection: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 16 },
    profileDetails: { marginLeft: 12, flex: 1 },
    profileName: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 4 },
    profileInfo: { fontSize: 14, color: '#666' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    label: { fontSize: 14, color: '#999', fontWeight: '500' },
    value: { fontSize: 14, color: '#333', flex: 1, textAlign: 'right', marginLeft: 16 },
    motivationSection: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8, marginVertical: 12 },
    motivationText: { fontSize: 14, color: '#555', fontStyle: 'italic', lineHeight: 20 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },

    // Youth Notification Card
    notificationCard: { marginBottom: 12, padding: 16, backgroundColor: 'white' },
    acceptedCard: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
    rejectedCard: { borderLeftWidth: 4, borderLeftColor: '#9E9E9E' },
    notifRow: { flexDirection: 'row', alignItems: 'flex-start' },
    notifContent: { marginLeft: 12, flex: 1 },
    notifTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
    notifText: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 8 },
    timeText: { fontSize: 12, color: '#999' },

    emptyContainer: { alignItems: 'center', marginTop: 50 },
    placeholder: { fontSize: 18, color: '#666', fontWeight: '500', marginBottom: 8 },
    placeholderSub: { fontSize: 14, color: '#999' }
});
