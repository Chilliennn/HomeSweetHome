
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, IconCircle, Button, Chip } from '../components/ui';
import { elderMatchingViewModel } from '@home-sweet-home/viewmodel';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Project icons
const IconHug = require('@/assets/images/icon-hug.png');

export const ElderlyReviewApplication = observer(function ElderlyReviewApplication() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const applicationId = params.applicationId as string;

    const vm = elderMatchingViewModel;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [application, setApplication] = useState<any>(null);

    // Load application data - ✅ MVVM: Use ViewModel method
    useEffect(() => {
        const loadApplication = async () => {
            try {
                const data = await vm.getApplicationById(applicationId);
                setApplication(data);
            } catch (error) {
                console.error('Failed to load application:', error);
            }
        };

        if (applicationId) {
            loadApplication();
        }
    }, [applicationId]);

    const handleBack = () => {
        router.back();
    };

    const handleApprove = async () => {
        Alert.alert(
            'Approve Application',
            'Are you sure you want to approve this application? This will begin the formal adoption process.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setIsSubmitting(true);
                        try {
                            await vm.reviewFormalApplication(applicationId, 'approve');
                            router.replace({
                                pathname: '/match-approved',
                                params: { applicationId }
                            } as any);
                        } catch (error) {
                            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to approve');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = () => {
        Alert.alert(
            'Reject Application',
            'Are you sure you want to reject this application?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setIsSubmitting(true);
                        try {
                            await vm.reviewFormalApplication(applicationId, 'reject');
                            Alert.alert('Rejected', 'The application has been rejected.', [
                                { text: 'OK', onPress: () => router.back() }
                            ]);
                        } catch (error) {
                            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to reject');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    // Loading state
    if (!application) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>Loading application...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const youth = application.youth;
    const youthProfile = youth?.profile_data || {};

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Application</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Icon Header */}
                <View style={styles.iconHeader}>
                    <View style={styles.hugIconCircle}>
                        <Image source={IconHug} style={styles.hugIcon} />
                    </View>
                    <Text style={styles.pageTitle}>Formal Application</Text>
                    <Text style={styles.pageSubtitle}>
                        {youth?.full_name || 'A Youth'} would like to adopt you
                    </Text>
                </View>

                {/* Youth Profile Card */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <IconCircle
                            icon={youthProfile.avatar_meta?.type === 'default' ? '👤' : '🧑'}
                            size={72}
                            backgroundColor="#B8D4E3"
                            contentScale={0.65}
                        />
                        <View style={styles.profileInfo}>
                            <Text style={styles.youthName}>{youth?.full_name || 'Youth Name'}</Text>
                            <Text style={styles.youthDetails}>
                                {youth?.location || 'Location'} • Youth
                            </Text>
                            {youthProfile.occupation && (
                                <Text style={styles.occupation}>{youthProfile.occupation}</Text>
                            )}
                        </View>
                    </View>

                    {/* Interests */}
                    {youthProfile.interests && youthProfile.interests.length > 0 && (
                        <View style={styles.interestsRow}>
                            {youthProfile.interests.slice(0, 4).map((interest: string, index: number) => (
                                <Chip
                                    key={index}
                                    label={interest}
                                    color="#9DE2D0"
                                    size="small"
                                    style={styles.chip}
                                />
                            ))}
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

                {/* Application Info */}
                <Card style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>📋 Application Details</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Submitted</Text>
                        <Text style={styles.detailValue}>
                            {new Date(application.applied_at).toLocaleDateString()}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Pre-match Duration</Text>
                        <Text style={styles.detailValue}>14 days</Text>
                    </View>
                </Card>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.rejectButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleReject}
                    disabled={isSubmitting}
                >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.approveButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleApprove}
                    disabled={isSubmitting}
                >
                    <Text style={styles.approveButtonText}>
                        {isSubmitting ? 'Processing...' : 'Approve'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFDF5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        color: Colors.light.text,
    },
    headerSpacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    iconHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    hugIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    hugIcon: {
        width: 60,
        height: 60,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
    },
    pageSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    profileCard: {
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#9DE2D0',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    youthName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    youthDetails: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    occupation: {
        fontSize: 14,
        color: Colors.light.primary,
        marginTop: 2,
    },
    interestsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        marginBottom: 4,
    },
    motivationCard: {
        padding: 20,
        marginBottom: 16,
        backgroundColor: '#F8F8F8',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 12,
    },
    motivationText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 24,
    },
    infoCard: {
        padding: 20,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
    },
    actionContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#FFE5E5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    rejectButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EB8F80',
    },
    approveButton: {
        flex: 1,
        backgroundColor: Colors.light.success,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    approveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default ElderlyReviewApplication;
