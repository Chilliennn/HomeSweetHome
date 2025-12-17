/**
 * SelectModal - Reusable dropdown/picker modal component
 * 
 * Follows the project design pattern from FilterModal.tsx
 * Uses project color scheme: #9DE2D0, #C8ADD6, #D4E5AE, #EB8F80, #FADE9F, #FFFFFF
 * 
 * Usage:
 * ```tsx
 * <SelectModal
 *   visible={showModal}
 *   title="Select Availability"
 *   options={[{ label: 'Morning', value: 'morning' }]}
 *   selectedValue={availability}
 *   onSelect={(value) => setAvailability(value)}
 *   onClose={() => setShowModal(false)}
 * />
 * ```
 */
import React from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================
interface SelectOption {
    label: string;
    value: string;
}

interface SelectModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Modal title */
    title: string;
    /** Options to display */
    options: SelectOption[];
    /** Currently selected value */
    selectedValue?: string;
    /** Callback when an option is selected */
    onSelect: (value: string) => void;
    /** Callback when modal is closed */
    onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const SelectModal: React.FC<SelectModalProps> = ({
    visible,
    title,
    options,
    selectedValue,
    onSelect,
    onClose,
}) => {
    const handleSelect = (value: string) => {
        onSelect(value);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Options List */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {options.map((option) => {
                        const isSelected = option.value === selectedValue;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                                onPress={() => handleSelect(option.value)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                    {option.label}
                                </Text>
                                {isSelected && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFDF5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 20,
        color: '#666',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    optionItemSelected: {
        backgroundColor: '#E8F5F2',
        borderColor: Colors.light.primary,
        borderWidth: 2,
    },
    optionText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    optionTextSelected: {
        fontWeight: '600',
        color: Colors.light.primary,
    },
    checkmark: {
        fontSize: 18,
        color: Colors.light.primary,
        fontWeight: '700',
        marginLeft: 12,
    },
});

export default SelectModal;
