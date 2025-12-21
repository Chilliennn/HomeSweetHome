/**
 * PreMatchDecisionScreen - View Details screen (104_1)
 * 
 * Shows after 7+ days when user clicks "View Details"
 * Allows user to:
 * - View partner profile and pre-match stats
 * - Submit formal application (Adopt)
 * - Decline and end pre-match
 * 
 * MVVM: View layer - UI only, logic in CommunicationViewModel
 */
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { communicationViewModel } from '@home-sweet-home/viewmodel';
import { Card, IconCircle, ProgressBar, Button } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Project asset icons
const IconClock = require('@/assets/images/icon-clock.png');

export const PreMatchDecisionScreen = observer(function PreMatchDecisionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const applicationId = params.applicationId as string;
    const vm = communicationViewModel;

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get chat data
    const chat = vm.getChatByApplicationId(applicationId);
    const status = vm.getPreMatchStatus(applicationId);

    // Handle missing data
    useEffect(() => {
        if (!chat && !vm.isLoading) {
            // Load chats first if not loaded
            if (!vm.hasLoadedOnce) {
                vm.loadActiveChats();
            }
        }
    }, [chat, vm.isLoading, vm.hasLoadedOnce]);

    // Handle Adopt button - navigate to formal application form
    const handleAdopt = () => {
        router.push({
            pathname: '/formal-application',
            params: { applicationId }
        } as any);
    };

    // Handle Decline button - navigate to end confirmation
    const handleDecline = () => {
        router.push({ pathname: '/end-pre-match', params: { applicationId } } as any);
    };

    // Handle back
    const handleBack = () => {
        router.back();
    };

    // Loading state
    if (!chat || !status) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const partner = chat.partnerUser;
    const messagesCount = chat.messages.length;
    const voiceCount = chat.messages.filter(m => m.message_type === 'voice').length;
    const daysRemaining = Math.max(0, 14 - status.daysPassed);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pre-Match Decision</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Partner Profile Section */}
                <View style={styles.profileSection}>
                    <IconCircle
                        icon={partner.profile_data?.avatar_meta?.type === 'default' ? '👵' : '👤'}
                        size={100}
                        backgroundColor="#C8ADD6"
                        contentScale={0.6}
                    />
                    <Text style={styles.partnerName}>{partner.full_name || 'Partner'}</Text>

                    {/* Duration Badge */}
                    <View style={styles.durationBadge}>
                        <Image source={IconClock} style={styles.clockIcon} />
                        <Text style={styles.durationText}>
                            Day {status.daysPassed} of 14 • {daysRemaining} days remaining
                        </Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <ProgressBar
                        progress={(status.daysPassed / 14) * 100}
                        fillColor={status.canApply ? Colors.light.success : Colors.light.secondary}
                        height={12}
                    />
                    <Text style={styles.progressHint}>
                        {status.isExpired
                            ? '⚠️ Pre-match period expired. Please make a decision.'
                            : status.canApply
                                ? '✅ Minimum period complete. You can now apply formally.'
                                : `${7 - status.daysPassed} days until you can apply`}
                    </Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{status.daysPassed}</Text>
                        <Text style={styles.statLabel}>Days</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{messagesCount}</Text>
                        <Text style={styles.statLabel}>Messages</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{voiceCount}</Text>
                        <Text style={styles.statLabel}>Voice Notes</Text>
                    </View>
                </View>

                {/* Info Text */}
                <Text style={styles.infoText}>
                    You've been chatting with {partner.full_name || 'your partner'} for {status.daysPassed} days.
                    Ready to take the next step?
                </Text>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.declineButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleDecline}
                    disabled={isSubmitting}
                >
                    <Text style={styles.declineButtonText}>Decline Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.adoptButton,
                        (isSubmitting || !status.canApply) && styles.buttonDisabled
                    ]}
                    onPress={handleAdopt}
                    disabled={isSubmitting || !status.canApply}
                >
                    <Text style={styles.adoptButtonText}>
                        {isSubmitting ? "Submitting..." : "Adopt"}
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#9DE2D0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon:{
        fontSize: 20,
        color: '#000000',
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
    content: {
        flex: 1,
        paddingHorizontal: 24,
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
    profileSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    partnerName: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginTop: 16,
        marginBottom: 12,
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    clockIcon: {
        width: 20,
        height: 20,
        marginRight: 8,
    },
    durationText: {
        fontSize: 14,
        color: '#666',
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressHint: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#F8F8F8',
        borderRadius: 16,
        paddingVertical: 20,
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.light.primary,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
    },
    infoText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    actionContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFFDF5',
    },
    declineButton: {
        flex: 1,
        backgroundColor: '#FFE5E5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    declineButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EB8F80',
    },
    adoptButton: {
        flex: 1,
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    adoptButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default PreMatchDecisionScreen;
