import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { consultationViewModel } from '@home-sweet-home/viewmodel';
import { relationshipService } from '../../../../Model/Service/CoreService/relationshipService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function RequestAdvisorScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userId = params.userId as string;
    const relationshipId = params.relationshipId as string;

    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [consultationType, setConsultationType] = useState('General Advice');
    const [description, setDescription] = useState('');
    const [preferredMethod, setPreferredMethod] = useState<'video_call' | 'phone' | 'chat'>('video_call');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchRelationship = async () => {
            if (!relationshipId || !userId) {
                setLoading(false);
                return;
            }
            try {
                const rel = await relationshipService.getRelationshipById(relationshipId);
                if (rel) {
                    const partner = rel.youth_id === userId ? rel.elderly_id : rel.youth_id;
                    setPartnerId(partner);
                }
            } catch (error) {
                console.error("Failed to load relationship", error);
                Alert.alert("Error", "Failed to load relationship details");
            } finally {
                setLoading(false);
            }
        };
        fetchRelationship();
    }, [relationshipId, userId]);

    const handleSubmit = async () => {
        if (description.trim().length < 10) {
            Alert.alert('Error', 'Please provide a description (at least 10 characters)');
            return;
        }

        if (!partnerId) {
            Alert.alert('Error', 'Partner information not found');
            return;
        }

        setIsSubmitting(true);
        try {
            const success = await consultationViewModel.submitConsultationRequest(
                userId,
                partnerId,
                relationshipId,
                consultationType,
                description,
                'normal',
                preferredMethod
            );

            if (success) {
                Alert.alert('Success! ✅', 'Your request has been submitted. An admin will assign an advisor soon.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', consultationViewModel.errorMessage || 'Failed to submit request');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const methods = [
        { id: 'video_call', label: 'Video Call 📹' },
        { id: 'phone', label: 'Phone Call 📞' },
        { id: 'chat', label: 'Chat Only 💬' },
    ];

    const types = ['General Advice', 'Conflict Resolution', 'Communication Support'];

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <LoadingSpinner message="Loading details..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Request Family Advisor</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.sectionTitle}>What do you need help with?</Text>
                    <View style={styles.typeContainer}>
                        {types.map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.typeButton, consultationType === t && styles.typeButtonSelected]}
                                onPress={() => setConsultationType(t)}
                            >
                                <Text style={[styles.typeText, consultationType === t && styles.typeTextSelected]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Describe your concern</Text>
                    <TextInput
                        style={styles.input}
                        multiline
                        numberOfLines={6}
                        placeholder="Please describe what is happening..."
                        value={description}
                        onChangeText={setDescription}
                        textAlignVertical="top"
                    />

                    <Text style={styles.sectionTitle}>Preferred Contact Method</Text>
                    <View style={styles.methodContainer}>
                        {methods.map(m => (
                            <TouchableOpacity
                                key={m.id}
                                style={[styles.methodButton, preferredMethod === m.id && styles.methodButtonSelected]}
                                onPress={() => setPreferredMethod(m.id as any)}
                            >
                                <Text style={[styles.methodText, preferredMethod === m.id && styles.methodTextSelected]}>{m.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FAF9F6',
    },
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAF9F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        backgroundColor: '#FFF',
    },
    backButton: {
        padding: 8,
    },
    backIcon: {
        fontSize: 24,
        color: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        marginTop: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    typeButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
    },
    typeButtonSelected: {
        backgroundColor: '#EB8F80',
        borderColor: '#EB8F80',
    },
    typeText: {
        color: '#666',
        fontWeight: '500',
    },
    typeTextSelected: {
        color: '#FFF',
    },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#DDD',
        minHeight: 120,
        marginBottom: 20,
        fontSize: 16,
    },
    methodContainer: {
        gap: 10,
        marginBottom: 30,
    },
    methodButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
    },
    methodButtonSelected: {
        backgroundColor: '#FFF5F3',
        borderColor: '#EB8F80',
        borderWidth: 2,
    },
    methodText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    methodTextSelected: {
        color: '#EB8F80',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#EB8F80',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
});
