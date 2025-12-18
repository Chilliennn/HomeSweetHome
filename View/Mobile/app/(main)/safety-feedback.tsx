// View/Mobile/app/(main)/safety-feedback.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { SafetyFeedbackViewModel } from '@home-sweet-home/viewmodel';
import { SafetyReportService } from '@home-sweet-home/model';
import { SafetyReportRepository } from '@home-sweet-home/model';
import { supabase } from '@home-sweet-home/model';

/**
 * Safety Feedback Screen (UC401: Report Safety Concern)
 * 
 * Allows elderly users to submit safety reports from chat conversations.
 * Features:
 * - Auto-detected reported user from chat context
 * - Report type selection (Positive Feedback / Safety Concern)
 * - Subject and description input
 * - Camera, gallery, and PDF file attachment
 * - AI-powered severity detection
 * - Critical alert notifications
 */

const SafetyFeedbackScreen = observer(() => {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Get navigation params from ChatScreen
    const userId = params.userId as string;
    const reportedUserId = params.reportedUserId as string;
    const reportedUserName = params.reportedUserName as string;
    const chatContext = params.chatContext as string;
    const contextId = params.contextId as string;

    // Initialize ViewModel
    const [vm] = useState(() => {
        const repository = new SafetyReportRepository(supabase);
        const service = new SafetyReportService(repository);
        return new SafetyFeedbackViewModel(service, userId || 'user-123');
    });

    // Show success modal when report is submitted
    useEffect(() => {
        if (vm.submitSuccess && vm.submittedReportId) {
            Alert.alert(
                '✅ Report Submitted Successfully',
                `Your report has been submitted.\n\nReport ID: ${vm.submittedReportId}\n\nYou can track your report status in your profile.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            vm.closeSuccessModal();
                            router.back();
                        },
                    },
                ]
            );
        }
    }, [vm.submitSuccess]);

    // Show error alerts
    useEffect(() => {
        if (vm.submitError) {
            Alert.alert('Error', vm.submitError, [
                { text: 'OK', onPress: () => vm.clearError() },
            ]);
        }
    }, [vm.submitError]);

    const handleSubmit = () => {
        vm.submitReport();
    };

    const handleFileUpload = () => {
        Alert.alert(
            'Select Source',
            'Choose how to add evidence',
            [
                {
                    text: 'Camera',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission Denied', 'Camera access is required to take photos.');
                            return;
                        }

                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.8,
                            allowsEditing: true,
                        });

                        if (!result.canceled && result.assets[0]) {
                            vm.addEvidenceFile({
                                name: `camera-${Date.now()}.jpg`,
                                uri: result.assets[0].uri,
                                type: 'image/jpeg',
                                size: result.assets[0].fileSize || 0,
                            } as any);
                        }
                    }
                },
                {
                    text: 'Gallery',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission Denied', 'Gallery access is required to select photos.');
                            return;
                        }

                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.8,
                            allowsMultipleSelection: false,
                        });

                        if (!result.canceled && result.assets[0]) {
                            const asset = result.assets[0];
                            vm.addEvidenceFile({
                                name: asset.fileName || `gallery-${Date.now()}.jpg`,
                                uri: asset.uri,
                                type: 'image/jpeg',
                                size: asset.fileSize || 0,
                            } as any);
                        }
                    }
                },
                {
                    text: 'Files (PDF)',
                    onPress: async () => {
                        try {
                            const result = await DocumentPicker.getDocumentAsync({
                                type: ['application/pdf', 'image/*'],
                                copyToCacheDirectory: true,
                            });

                            if (!result.canceled && result.assets[0]) {
                                const asset = result.assets[0];
                                if (asset.size && asset.size > 10 * 1024 * 1024) {
                                    Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
                                    return;
                                }
                                vm.addEvidenceFile({
                                    name: asset.name,
                                    uri: asset.uri,
                                    type: asset.mimeType || 'application/pdf',
                                    size: asset.size || 0,
                                } as any);
                            }
                        } catch (error) {
                            console.error('[FileUpload] Error:', error);
                            Alert.alert('Error', 'Failed to select file. Please try again.');
                        }
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Safety Feedback</Text>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={20} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Form Description */}
                <Text style={styles.formDescription}>Tell us about your experience</Text>

                {/* Auto-detected context (if available) */}
                {reportedUserName && (
                    <View style={styles.contextCard}>
                        <Ionicons name="person-outline" size={16} color="#666" />
                        <Text style={styles.contextText}>
                            Reporting about: <Text style={styles.contextBold}>{reportedUserName}</Text>
                        </Text>
                    </View>
                )}

                {/* Report Type */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Report Type <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.dropdown,
                            vm.errors.reportType && styles.inputError,
                        ]}
                        onPress={() => {
                            Alert.alert(
                                'Select Report Type',
                                '',
                                [
                                    {
                                        text: 'Positive Feedback',
                                        onPress: () => vm.setReportType('Positive Feedback'),
                                    },
                                    {
                                        text: 'Safety Concern',
                                        onPress: () => vm.setReportType('Safety Concern'),
                                    },
                                    { text: 'Cancel', style: 'cancel' },
                                ]
                            );
                        }}
                    >
                        <Text style={vm.reportType ? styles.dropdownText : styles.dropdownPlaceholder}>
                            {vm.reportType || 'Select Report Type'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    {vm.errors.reportType && (
                        <Text style={styles.errorText}>{vm.errors.reportType}</Text>
                    )}
                </View>

                {/* Subject */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Subject <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            vm.errors.subject && styles.inputError,
                        ]}
                        placeholder="Enter subject title"
                        placeholderTextColor="#999"
                        value={vm.subject}
                        onChangeText={vm.setSubject}
                    />
                    {vm.errors.subject && (
                        <Text style={styles.errorText}>{vm.errors.subject}</Text>
                    )}
                </View>

                {/* Description */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Description <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[
                            styles.textArea,
                            vm.errors.description && styles.inputError,
                        ]}
                        placeholder="Describe your experience in detail..."
                        placeholderTextColor="#999"
                        value={vm.description}
                        onChangeText={vm.setDescription}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                    {vm.errors.description && (
                        <Text style={styles.errorText}>{vm.errors.description}</Text>
                    )}
                </View>

                {/* File Upload */}
                <View style={styles.fieldContainer}>
                    <TouchableOpacity
                        style={styles.fileUploadContainer}
                        onPress={handleFileUpload}
                    >
                        <View style={styles.uploadIconContainer}>
                            <Ionicons name="cloud-upload-outline" size={40} color="#000" />
                        </View>
                        <Text style={styles.fileUploadText}>Tap to select files</Text>
                        <Text style={styles.fileUploadSubtext}>JPG, PNG, PDF, Max 10MB</Text>
                    </TouchableOpacity>

                    {/* Display selected files */}
                    {vm.evidenceFiles.length > 0 && (
                        <View style={styles.filesListContainer}>
                            {vm.evidenceFiles.map((file, index) => (
                                <View key={index} style={styles.fileItem}>
                                    <Ionicons name="document-outline" size={20} color="#666" />
                                    <Text style={styles.fileName} numberOfLines={1}>
                                        {file.name}
                                    </Text>
                                    <TouchableOpacity onPress={() => vm.removeEvidenceFile(index)}>
                                        <Ionicons name="close-circle" size={20} color="#E89B8E" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        vm.isSubmitting && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={vm.isSubmitting}
                >
                    {vm.isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Report</Text>
                    )}
                </TouchableOpacity>

                {/* Info Text */}
                <Text style={styles.infoText}>
                    Your report will be reviewed by our team. If marked as critical, NGO admins will be notified immediately.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFDF5', // Figma warm cream background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F5E6D3',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#9DE2D0', // Mint green circular button
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 20,
        color: '#000',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#9DE2D0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    formDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    contextCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9F6',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    contextText: {
        fontSize: 14,
        color: '#666',
    },
    contextBold: {
        fontWeight: '600',
        color: '#333',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#E89B8E',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#F5E6D3',
        borderRadius: 16, // Softer corners
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#F5E6D3',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#F5E6D3',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
        minHeight: 120,
    },
    inputError: {
        borderColor: '#E89B8E',
        borderWidth: 2,
    },
    errorText: {
        fontSize: 12,
        color: '#E89B8E',
        marginTop: 4,
    },
    fileUploadContainer: {
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#F5E6D3',
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIconContainer: {
        marginBottom: 8,
    },
    fileUploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
    },
    fileUploadSubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    filesListContainer: {
        marginTop: 12,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
        marginRight: 8,
    },
    submitButton: {
        backgroundColor: '#E89B8E', // Coral pink
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
});

export default SafetyFeedbackScreen;
