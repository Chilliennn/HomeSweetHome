// View/Mobile/app/(main)/report-history.tsx

import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@home-sweet-home/model';
import { SafetyReportRepository } from '../../../../Model/Repository/AdminRepository/SafetyReportRepository';
import { SafetyReportService } from '../../../../Model/Service/CoreService/SafetyReportService';
import { SafetyFeedbackViewModel, authViewModel } from '@home-sweet-home/viewmodel';
import type { SafetyReport } from '../../../../Model/types/SafetyTypes';
import { Colors } from '@/constants/theme';

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    'Pending': { bg: '#FFF3CD', text: '#856404' },
    'In Review': { bg: '#D1ECF1', text: '#0C5460' },
    'Resolved': { bg: '#D4EDDA', text: '#155724' },
};

// Severity badge colors
const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
    'Critical': { bg: '#F8D7DA', text: '#721C24' },
    'High': { bg: '#FFE5D0', text: '#C25400' },
    'Medium': { bg: '#FFF3CD', text: '#856404' },
    'Low': { bg: '#D4EDDA', text: '#155724' },
};

const ReportCard = ({ report, onPress }: { report: SafetyReport; onPress: () => void }) => {
    const statusColor = STATUS_COLORS[report.status] || STATUS_COLORS['Pending'];
    const severityColor = SEVERITY_COLORS[report.severity_level] || SEVERITY_COLORS['Medium'];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {report.subject || 'Safety Report'}
                </Text>
                <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.badgeText, { color: statusColor.text }]}>
                        {report.status}
                    </Text>
                </View>
            </View>

            <Text style={styles.cardDescription} numberOfLines={2}>
                {report.description}
            </Text>

            <View style={styles.cardFooter}>
                <View style={[styles.badge, { backgroundColor: severityColor.bg }]}>
                    <Text style={[styles.badgeText, { color: severityColor.text }]}>
                        {report.severity_level}
                    </Text>
                </View>
                <Text style={styles.cardDate}>
                    {formatDate(report.created_at)}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const ReportHistoryScreen = observer(() => {
    const router = useRouter();
    const params = useLocalSearchParams<{ userId?: string }>();

    // Get userId from route params OR authViewModel fallback
    const userId = params.userId || authViewModel.authState.currentUserId || '';

    // Initialize ViewModel with actual userId
    const viewModel = useMemo(() => {
        if (!userId) return null;
        const repository = new SafetyReportRepository(supabase);
        const service = new SafetyReportService(repository);
        return new SafetyFeedbackViewModel(service, userId);
    }, [userId]);

    useEffect(() => {
        if (viewModel && userId) {
            viewModel.loadUserReports();
        }
    }, [viewModel, userId]);

    const handleRefresh = () => {
        viewModel?.loadUserReports();
    };

    const handleReportPress = (report: SafetyReport) => {
        console.log('Report pressed:', report.id);
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Reports Yet</Text>
            <Text style={styles.emptySubtitle}>
                Your submitted safety reports will appear here
            </Text>
            <TouchableOpacity
                style={styles.newReportButton}
                onPress={() => router.push('/safety-feedback')}
            >
                <Text style={styles.newReportButtonText}>Submit a Report</Text>
            </TouchableOpacity>
        </View>
    );

    // Show loading if no userId yet
    if (!userId || !viewModel) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report History</Text>
                <TouchableOpacity
                    onPress={() => router.push('/safety-feedback')}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color={Colors.light.primary} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            {viewModel.isLoadingHistory && viewModel.reportHistory.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>Loading reports...</Text>
                </View>
            ) : viewModel.historyError ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#DC3545" />
                    <Text style={styles.errorText}>{viewModel.historyError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={viewModel.reportHistory}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ReportCard report={item} onPress={() => handleReportPress(item)} />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={viewModel.isLoadingHistory}
                            onRefresh={handleRefresh}
                            colors={[Colors.light.primary]}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    addButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
        color: '#DC3545',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: Colors.light.primary,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    separator: {
        height: 12,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardDate: {
        fontSize: 12,
        color: '#999',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    newReportButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.light.primary,
        borderRadius: 8,
    },
    newReportButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ReportHistoryScreen;
