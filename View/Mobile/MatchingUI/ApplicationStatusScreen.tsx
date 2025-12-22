/**
 * ApplicationStatusScreen - Shows status of submitted formal application
 * 
 * Displays timeline of application progress for youth after they submit
 * a formal application.
 * 
 * UC101_12: Youth tracks application status
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { youthMatchingViewModel } from '@home-sweet-home/viewmodel';
import { Header, Button, Card, IconCircle, TimelineItem } from '@/components/ui';
import { Colors } from '@/constants/theme';

export const ApplicationStatusScreen = observer(function ApplicationStatusScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const applicationId = params.applicationId as string;

    const vm = youthMatchingViewModel;

    // ✅ Safely load application data on mount
    useEffect(() => {
        if (applicationId) {
            vm.loadApplicationById(applicationId);
        }
    }, [applicationId]);

    // Get application and partner data from MatchingViewModel (sync from cache)
    const data = vm.getApplicationById(applicationId);
    const application = data?.application;
    const partner = data?.partnerUser;

    // Calculate days since application submitted
    const getSubmittedDaysAgo = () => {
        if (!application?.reviewed_at) return 'Recently';
        const submittedDate = new Date(application.reviewed_at);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince === 0) return 'Today';
        if (daysSince === 1) return 'Yesterday';
        return `${daysSince} days ago`;
    };

    // Determine step statuses based on application.status
    // Status flow: pending_review -> (admin reviews) -> both_accepted/rejected
    const getStepStatuses = () => {
        const status = application?.status;

        // Step 1: Application Submitted - always completed if we're here
        const step1Status: 'completed' | 'current' | 'pending' = 'completed';

        // Step 2: Admin Review - current if pending_review, completed if admin reviewed
        // For now, we assume pending_review means admin is reviewing
        let step2Status: 'completed' | 'current' | 'pending' = 'pending';

        // Step 3: Elderly Review - pending by default
        let step3Status: 'completed' | 'current' | 'pending' = 'pending';

        if (status === 'pending_review') {
            // Application submitted, waiting for admin review
            step2Status = 'current';
            step3Status = 'pending';
        } else if (status === 'approved' || status === 'info_requested') {
            // Admin reviewed, waiting for elderly
            step2Status = 'completed';
            step3Status = 'current';
        } else if (status === 'both_accepted' || status === 'rejected') {
            // Process complete
            step2Status = 'completed';
            step3Status = 'completed';
        }

        return { step1Status, step2Status, step3Status };
    };

    const { step1Status, step2Status, step3Status } = getStepStatuses();

    // Determine current status message
    const getStatusMessage = () => {
        const status = application?.status;
        if (status === 'pending_review') {
            return {
                icon: '📝',
                title: 'Under Admin Review',
                subtitle: 'Your application is being reviewed by our team. This usually takes 24-48 hours.'
            };
        } else if (status === 'approved' || status === 'info_requested') {
            return {
                icon: '👵',
                title: 'Waiting for Elderly Review',
                subtitle: `${partner?.full_name || 'The elderly'} is reviewing your application.`
            };
        } else if (status === 'both_accepted') {
            return {
                icon: '🎉',
                title: 'Application Approved!',
                subtitle: 'Congratulations! Your application has been approved.'
            };
        } else if (status === 'rejected') {
            return {
                icon: '😔',
                title: 'Application Not Approved',
                subtitle: 'Unfortunately, your application was not approved this time.'
            };
        }
        return {
            icon: '⏳',
            title: 'Processing',
            subtitle: 'Your application is being processed.'
        };
    };

    const statusMessage = getStatusMessage();

    const handleBack = () => {
        console.log('[ApplicationStatusScreen] handleBack called');
        // Navigate to chat list (original behavior)
        console.log('[ApplicationStatusScreen] Navigating to /(main)/chat...');
        router.push('/(main)/chat' as any);
    };

    const handleBackToChats = () => {
        console.log('[ApplicationStatusScreen] handleBackToChats called');
        console.log('[ApplicationStatusScreen] Navigating to /(main)/chat...');
        router.push('/(main)/chat' as any);
    };

    // ✅ Show loading state while fetching data
    if (vm.isLoadingApplication) {
        return (
            <SafeAreaView style={styles.container}>
                <Header title="Application Status" onBack={handleBack} />
                <View style={styles.errorContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={[styles.errorText, { marginTop: 16 }]}>Loading application...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!application || !partner) {
        return (
            <SafeAreaView style={styles.container}>
                <Header title="Application Status" onBack={handleBack} />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Application not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Header title="Application Status" onBack={handleBack} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Partner Card */}
                <Card style={styles.partnerCard}>
                    <View style={styles.partnerRow}>
                        {partner.profile_photo_url ? (
                            <Image
                                source={{ uri: partner.profile_photo_url }}
                                style={styles.profilePhoto}
                            />
                        ) : (
                            <IconCircle
                                icon="👵"
                                size={64}
                                backgroundColor="#C8ADD6"
                                contentScale={0.6}
                            />
                        )}
                        <View style={styles.partnerInfo}>
                            <Text style={styles.partnerName}>{partner.full_name || 'Partner'}</Text>
                            <Text style={styles.submittedText}>
                                Application submitted {getSubmittedDaysAgo()}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Status Banner */}
                <View style={styles.statusBanner}>
                    <Text style={styles.statusIcon}>{statusMessage.icon}</Text>
                    <View style={styles.statusTextContainer}>
                        <Text style={styles.statusTitle}>{statusMessage.title}</Text>
                        <Text style={styles.statusSubtext}>{statusMessage.subtitle}</Text>
                    </View>
                </View>

                {/* Timeline - 3 Steps */}
                <View style={styles.timelineSection}>
                    <Text style={styles.sectionTitle}>Application Timeline</Text>

                    <TimelineItem
                        title="Application Submitted"
                        subtitle="Your formal application was submitted"
                        icon="📋"
                        status={step1Status}
                        showLine={true}
                    />

                    <TimelineItem
                        title="Admin Review"
                        subtitle="Our team reviews your application (24-48 hours)"
                        icon="👨‍"
                        status={step2Status}
                        showLine={true}
                    />

                    <TimelineItem
                        title="Elderly Review"
                        subtitle={`${partner.full_name || 'Elderly'} makes final decision`}
                        icon="👵"
                        status={step3Status}
                        showLine={false}
                    />
                </View>

                {/* Info Card */}
                <Card style={styles.infoCard}>
                    <Text style={styles.infoTitle}>💬 You can still chat!</Text>
                    <Text style={styles.infoText}>
                        While waiting for a decision, you can continue chatting with {partner.full_name} and your other pre-matches.
                    </Text>
                </Card>

                {/* Actions */}
                <Button
                    title="Back to Chats"
                    onPress={handleBackToChats}
                    variant="primary"
                    style={styles.button}
                />
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
    partnerCard: {
        padding: 16,
        marginBottom: 16,
    },
    profilePhoto: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E0E0E0',
    },
    partnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    partnerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    partnerName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    submittedText: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    statusBanner: {
        flexDirection: 'row',
        backgroundColor: '#FFF3E0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    statusIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF9800',
        marginBottom: 4,
    },
    statusSubtext: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    timelineSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    infoCard: {
        padding: 16,
        marginBottom: 20,
        backgroundColor: '#E8F5E9',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 20,
    },
    button: {
        marginTop: 8,
    },
});

export default ApplicationStatusScreen;
