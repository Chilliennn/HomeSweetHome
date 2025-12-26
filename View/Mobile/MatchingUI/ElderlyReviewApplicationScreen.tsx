
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { elderMatchingViewModel } from '@home-sweet-home/viewmodel';
import { matchingService } from '../../../Model/Service/CoreService/matchingService';
import { Header, Button, Card, IconCircle, LoadingSpinner } from '@/components/ui';
import { Colors } from '@/constants/theme';

export const ElderlyReviewApplicationScreen = observer(function ElderlyReviewApplicationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const applicationId = params.applicationId as string;

    const vm = elderMatchingViewModel;
    const [application, setApplication] = useState<any>(null);
    const [isLoadingApp, setIsLoadingApp] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Load application details
    useEffect(() => {
        async function loadApplication() {
            try {
                const app = await matchingService.getApplicationById(applicationId);
                setApplication(app);
            } catch (error) {
                console.error('[ElderlyReview] Failed to load application:', error);
                Alert.alert('Error', 'Failed to load application');
                router.back();
            } finally {
                setIsLoadingApp(false);
            }
        }
        loadApplication();
    }, [applicationId]);

    const handleAccept = async () => {
        Alert.alert(
            'Accept Application',
            'Are you sure you want to accept this application? This will start a formal relationship.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        const success = await vm.respondToApprovedApplication(applicationId, 'accept');
                        if (success) {
                            // Get user ID from ViewModel or application
                            const userId = vm.currentUserId || application?.elderly_id;
                            Alert.alert('Success', 'Application accepted! Relationship started.', [
                                {
                                    text: 'OK',
                                    onPress: () => router.replace({
                                        pathname: '/(main)/bonding',
                                        params: { userId }
                                    } as any)
                                }
                            ]);
                        } else {
                            Alert.alert('Error', vm.error || 'Failed to accept application');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = () => {
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        const success = await vm.respondToApprovedApplication(
            applicationId,
            'reject',
            rejectReason.trim() || undefined
        );
        if (success) {
            setShowRejectModal(false);
            Alert.alert('Done', 'Application declined.', [
                { text: 'OK', onPress: () => router.replace('/(main)/chat' as any) }
            ]);
        } else {
            Alert.alert('Error', vm.error || 'Failed to decline application');
        }
    };

    const handleBack = () => {
        router.back();
    };

    if (isLoadingApp) {
        return (
            <SafeAreaView style={styles.container}>
                <Header title="Review Application" onBack={handleBack} />
                <View style={styles.loadingContainer}>
                    <LoadingSpinner size="large" />
                </View>
            </SafeAreaView>
        );
    }

    if (!application) {
        return (
            <SafeAreaView style={styles.container}>
                <Header title="Review Application" onBack={handleBack} />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Application not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const youth = application.youth;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Header title="Review Application" onBack={handleBack} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Youth Profile Card */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        {youth?.profile_photo_url ? (
                            <Image
                                source={{ uri: youth.profile_photo_url }}
                                style={styles.profilePhoto}
                            />
                        ) : (
                            <IconCircle
                                icon="🧑"
                                size={80}
                                backgroundColor="#B8D4E3"
                                contentScale={0.6}
                            />
                        )}
                        <View style={styles.profileInfo}>
                            <Text style={styles.youthName}>{youth?.full_name || 'Youth'}</Text>
                            <Text style={styles.youthDetail}>
                                📍 {youth?.location || 'Unknown location'}
                            </Text>
                            {youth?.profile_data?.verified_age && (
                                <Text style={styles.youthDetail}>
                                    🎂 {youth.profile_data.verified_age} years old
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Interests */}
                    {youth?.profile_data?.interests && youth.profile_data.interests.length > 0 && (
                        <View style={styles.interestsSection}>
                            <Text style={styles.sectionLabel}>Interests</Text>
                            <View style={styles.tagsRow}>
                                {youth.profile_data.interests.map((interest: string, idx: number) => (
                                    <View key={idx} style={styles.tag}>
                                        <Text style={styles.tagText}>{interest}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </Card>

                {/* Motivation Letter */}
                <Card style={styles.motivationCard}>
                    <Text style={styles.sectionTitle}>📝 Motivation Letter</Text>
                    <Text style={styles.motivationText}>
                        {application.motivation_letter || 'No motivation letter provided.'}
                    </Text>
                </Card>

                {/* Status Banner */}
                <View style={styles.statusBanner}>
                    <Text style={styles.statusIcon}>✅</Text>
                    <View style={styles.statusTextContainer}>
                        <Text style={styles.statusTitle}>Admin Approved</Text>
                        <Text style={styles.statusSubtext}>
                            This application has been reviewed and approved by our team.
                            You can now decide whether to accept this youth.
                        </Text>
                    </View>
                </View>

                {/* Reject Modal */}
                {showRejectModal && (
                    <Card style={styles.rejectModal}>
                        <Text style={styles.modalTitle}>Decline Application</Text>
                        <Text style={styles.modalSubtext}>
                            (Optional) Provide a reason for declining:
                        </Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Enter reason (optional)..."
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                            maxLength={200}
                        />
                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                onPress={() => setShowRejectModal(false)}
                                variant="secondary"
                                style={styles.modalButton}
                            />
                            <Button
                                title="Confirm Decline"
                                onPress={confirmReject}
                                variant="destructive"
                                style={styles.modalButton}
                                disabled={vm.isLoading}
                            />
                        </View>
                    </Card>
                )}

                {/* Action Buttons */}
                {!showRejectModal && (
                    <View style={styles.actionButtons}>
                        <Button
                            title="Accept Application"
                            onPress={handleAccept}
                            variant="primary"
                            style={styles.acceptButton}
                            disabled={vm.isLoading}
                        />
                        <Button
                            title="Decline"
                            onPress={handleReject}
                            variant="secondary"
                            style={styles.rejectButton}
                            disabled={vm.isLoading}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFDF5',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
    profileCard: {
        padding: 20,
        marginBottom: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profilePhoto: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E0E0E0',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    youthName: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
    },
    youthDetail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    interestsSection: {
        marginTop: 8,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 13,
        color: '#4CAF50',
    },
    motivationCard: {
        padding: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    motivationText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 24,
    },
    statusBanner: {
        flexDirection: 'row',
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    statusIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 4,
    },
    statusSubtext: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    actionButtons: {
        gap: 12,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {},
    rejectModal: {
        padding: 20,
        marginBottom: 16,
        backgroundColor: '#FFF3E0',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF9800',
        marginBottom: 8,
    },
    modalSubtext: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    reasonInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        fontSize: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
    },
});

export default ElderlyReviewApplicationScreen;
