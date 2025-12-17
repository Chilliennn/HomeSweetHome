/**
 * EndPreMatchScreen - End confirmation flow (104_3, 104_4)
 * 
 * Two-step flow:
 * - Step 1 (104_3): Confirmation with warning icon
 * - Step 2 (104_4): Success with bye-bye icon
 * 
 * MVVM: View layer - UI only, logic in CommunicationViewModel
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { communicationViewModel } from '@home-sweet-home/viewmodel';
import { IconCircle } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Project asset icons
const IconWarning = require('@/assets/images/icon-warning.png');
const IconStop = require('@/assets/images/icon-stop.png');
const IconByeBye = require('@/assets/images/icon-byebye.png');

type Step = 'confirm' | 'success';

export const EndPreMatchScreen = observer(function EndPreMatchScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const applicationId = params.applicationId as string;
    const fromExpired = params.fromExpired === 'true';
    const vm = communicationViewModel;

    const [step, setStep] = useState<Step>('confirm');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Cache partner name so we can show it in success screen even after chat is removed
    const [cachedPartnerName, setCachedPartnerName] = useState<string | null>(null);

    // Get chat data
    const chat = vm.getChatByApplicationId(applicationId);
    const partner = chat?.partnerUser;

    // Cache partner name when chat is available
    React.useEffect(() => {
        if (partner?.full_name && !cachedPartnerName) {
            setCachedPartnerName(partner.full_name);
        }
    }, [partner?.full_name, cachedPartnerName]);

    // Handle back
    const handleBack = () => {
        router.back();
    };

    // Handle cancel
    const handleCancel = () => {
        router.back();
    };

    // Handle confirm end
    const handleConfirmEnd = async () => {
        // Cache partner name before ending (chat will be removed from list)
        if (partner?.full_name) {
            setCachedPartnerName(partner.full_name);
        }

        setIsSubmitting(true);
        const success = await vm.endPreMatch(applicationId);
        setIsSubmitting(false);

        if (success) {
            setStep('success');
        } else {
            // Error message is set in ViewModel
        }
    };

    const handleDone = () => {
        // Navigate back to chat list
        router.replace('/(main)/chat' as any);
    };

    // Loading state - only show in confirm step (not in success step)
    if (!chat && step === 'confirm') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                </View>
            </SafeAreaView>
        );
    }

    // Use cached name for success screen
    const displayPartnerName = cachedPartnerName || partner?.full_name || 'your partner';

    // Step 2: Success screen (104_4)
    if (step === 'success') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    {/* Bye-Bye Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.successIconCircle}>
                            <Image source={IconByeBye} style={styles.largeIcon} />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.successTitle}>Pre-Match Ended</Text>
                    <Text style={styles.successSubtitle}>
                        Your pre-match with{'\n'}
                        <Text style={styles.partnerHighlight}>{displayPartnerName}</Text>
                        {'\n'}has been ended.
                    </Text>

                    {/* Info Box */}
                    <View style={styles.successInfoBox}>
                        <Text style={styles.successInfoText}>
                            You can now browse other profiles and start new pre-matches.
                            Thank you for participating!
                        </Text>
                    </View>
                </View>

                {/* Done Button */}
                <View style={styles.singleButtonContainer}>
                    <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Step 1: Confirmation screen (104_3)
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>End Pre-Match</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.content}>
                {/* Warning Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.warningIconCircle}>
                        <Image source={IconWarning} style={styles.largeIcon} />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Are you sure?</Text>
                <Text style={styles.subtitle}>
                    You're about to end your pre-match with{'\n'}
                    <Text style={styles.partnerHighlight}>{displayPartnerName}</Text>
                </Text>

                {/* Consequences List */}
                <View style={styles.consequencesList}>
                    <View style={styles.consequenceItem}>
                        <Image source={IconStop} style={styles.consequenceIcon} />
                        <Text style={styles.consequenceText}>Chat access will be removed</Text>
                    </View>

                    <View style={styles.consequenceItem}>
                        <Image source={IconStop} style={styles.consequenceIcon} />
                        <Text style={styles.consequenceText}>Your partner will be notified</Text>
                    </View>

                    <View style={styles.consequenceItem}>
                        <Image source={IconStop} style={styles.consequenceIcon} />
                        <Text style={styles.consequenceText}>This action cannot be undone</Text>
                    </View>
                </View>

                {/* Error Display */}
                {vm.errorMessage && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{vm.errorMessage}</Text>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.cancelButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleCancel}
                    disabled={isSubmitting}
                >
                    <Text style={styles.cancelButtonText}>Go Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleConfirmEnd}
                    disabled={isSubmitting}
                >
                    <Text style={styles.confirmButtonText}>
                        {isSubmitting ? "Ending..." : "End Pre-Match"}
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
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    warningIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    largeIcon: {
        width: 64,
        height: 64,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FF9800',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    partnerHighlight: {
        fontWeight: '600',
        color: Colors.light.text,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.light.success,
        marginBottom: 16,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    consequencesList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    consequenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    consequenceIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    consequenceText: {
        flex: 1,
        fontSize: 15,
        color: '#666',
    },
    successInfoBox: {
        backgroundColor: '#E8F5E9',
        padding: 20,
        borderRadius: 12,
        width: '100%',
    },
    successInfoText: {
        fontSize: 15,
        color: '#2E7D32',
        textAlign: 'center',
        lineHeight: 22,
    },
    errorContainer: {
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        width: '100%',
    },
    errorText: {
        color: '#C62828',
        textAlign: 'center',
    },
    actionContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#EB8F80',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    singleButtonContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    doneButton: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default EndPreMatchScreen;
