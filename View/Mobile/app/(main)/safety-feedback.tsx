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
    Modal,
    ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafetyFeedbackViewModel } from '@home-sweet-home/viewmodel';
import { SafetyReportService } from '@home-sweet-home/model';
import { SafetyReportRepository } from '@home-sweet-home/model';
import { supabase } from '@home-sweet-home/model';

/**
 * Safety Feedback Screen (UC401: Report Safety Concern)
 * 
 * Allows elderly users to submit safety reports or positive feedback.
 * Features:
 * - Report type selection (Positive Feedback / Safety Concern)
 * - Subject and description input
 * - File attachment support
 * - AI-powered severity detection
 * - Critical alert notifications
 */

const SafetyFeedbackScreen = observer(() => {
    const router = useRouter();

    // Initialize ViewModel
    const [vm] = useState(() => {
        const repository = new SafetyReportRepository(supabase);
        const service = new SafetyReportService(repository);
        // TODO: Get actual user ID from auth context
        const userId = 'user-123';
        return new SafetyFeedbackViewModel(service, userId);
    });

    // UC401_12 & UC401_13: Show success modal when report is submitted
    useEffect(() => {
        if (vm.submitSuccess && vm.submittedReportId) {
            Alert.alert(
                '✅ Report Submitted Successfully',
                `Your report has been submitted.\n\nReport ID: ${vm.submittedReportId}\n\nYou can track your report status in your profile.`,
                [
                    {
                        text: 'OK',
                        onPress: () => vm.closeSuccessModal(),
                    },
                ]
            );
        }
    }, [vm.submitSuccess]);

    // UC401 M1: Error loading form
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

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Safety Feedback</Text>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Form Description */}
                <Text style={styles.formDescription}>Tell us about your experience</Text>

                {/* Report Type - UC401_4 */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Report Type <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.dropdownContainer}>
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
                    </View>
                    {vm.errors.reportType && (
                        <Text style={styles.errorText}>{vm.errors.reportType}</Text>
                    )}
                </View>

                {/* Subject - UC401_4 */}
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

                {/* Description - UC401_4 */}
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

                {/* File Upload - UC401_4 & UC401_6 */}
                <View style={styles.fieldContainer}>
                    <TouchableOpacity
                        style={styles.fileUploadContainer}
                        onPress={() => {
                            Alert.alert(
                                'File Upload',
                                'File upload functionality will be implemented with expo-document-picker',
                                [{ text: 'OK' }]
                            );
                        }}
                    >
                        <Ionicons name="cloud-upload-outline" size={48} color="#9DE2D0" />
                        <Text style={styles.fileUploadText}>Tap to select files</Text>
                        <Text style={styles.fileUploadSubtext}>JPG, PNG, PDF, Max 10MB</Text>
                    </TouchableOpacity>
                    {vm.errors.evidenceFiles && (
                        <Text style={styles.errorText}>{vm.errors.evidenceFiles}</Text>
                    )}

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

                {/* Submit Button - UC401_7 */}
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
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
        backgroundColor: '#9DE2D0',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    notificationButton: {
        padding: 8,
        backgroundColor: '#9DE2D0',
        borderRadius: 20,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    formDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
    },
    fieldContainer: {
        marginBottom: 24,
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
    dropdownContainer: {
        position: 'relative',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
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
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
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
        borderColor: '#E5E5E5',
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileUploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
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
        borderRadius: 8,
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
        backgroundColor: '#E89B8E',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
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
