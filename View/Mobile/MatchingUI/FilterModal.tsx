import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Chip } from '@/components/ui';
import { ElderlyFilters } from '@home-sweet-home/model';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: ElderlyFilters) => void;
    currentFilters: ElderlyFilters;
}

// Available options (based on UC101_C6)

const INTEREST_OPTIONS = [
    'cooking',
    'music', 
    'gardening',
    'arts',
    'reading',
    'games',
    'travel',
    'exercise',
    'photography',
    'crafts',
    'technology',
    'history',
    'nature',
    'movies',
    'sports',
    'walking',
];

// ⚠️ IMPORTANT: Must match ProfileInfoForm's LANGUAGE_OPTIONS ids (lowercase)
const LANGUAGE_OPTIONS = ['malay', 'english', 'mandarin', 'tamil', 'cantonese', 'hokkien'];

// Malaysia Location Options - Must match ProfileSetupForm for consistent filtering
const LOCATION_OPTIONS = [
    // States (13)
    'Johor',
    'Kedah',
    'Kelantan',
    'Malacca (Melaka)',
    'Negeri Sembilan',
    'Pahang',
    'Penang (Pulau Pinang)',
    'Perak',
    'Perlis',
    'Sabah',
    'Sarawak',
    'Selangor',
    'Terengganu',
    // Federal Territories (3)
    'Kuala Lumpur',
    'Labuan',
    'Putrajaya',
];

export const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    onApply,
    currentFilters,
}) => {
    const [selectedInterests, setSelectedInterests] = useState<string[]>(
        currentFilters.interests || []
    );
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
        currentFilters.languages || []
    );
    const [selectedLocation, setSelectedLocation] = useState<string>(
        currentFilters.location || ''
    );

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const toggleLanguage = (lang: string) => {
        setSelectedLanguages(prev =>
            prev.includes(lang)
                ? prev.filter(l => l !== lang)
                : [...prev, lang]
        );
    };

    const handleApply = () => {
        const filters: ElderlyFilters = {};

        if (selectedInterests.length > 0) {
            filters.interests = selectedInterests;
        }
        if (selectedLanguages.length > 0) {
            filters.languages = selectedLanguages;
        }
        if (selectedLocation) {
            filters.location = selectedLocation;
        }

        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setSelectedInterests([]);
        setSelectedLanguages([]);
        setSelectedLocation('');
    };

    const activeFilterCount =
        (selectedInterests.length > 0 ? 1 : 0) +
        (selectedLanguages.length > 0 ? 1 : 0) +
        (selectedLocation ? 1 : 0);

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
                    <Text style={styles.title}>Filter Elders</Text>
                    <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                        <Text style={styles.resetText}>Reset</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Interests Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Interests</Text>
                        <Text style={styles.sectionHint}>Select interests to find matching elders</Text>
                        <View style={styles.chipsContainer}>
                            {INTEREST_OPTIONS.map(interest => (
                                <TouchableOpacity
                                    key={interest}
                                    onPress={() => toggleInterest(interest)}
                                >
                                    <Chip
                                        label={interest.charAt(0).toUpperCase() + interest.slice(1)}
                                        color={selectedInterests.includes(interest) ? Colors.light.primary : '#E0E0E0'}
                                        size="small"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Languages Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Language</Text>
                        <Text style={styles.sectionHint}>Filter by communication language</Text>
                        <View style={styles.chipsContainer}>
                            {LANGUAGE_OPTIONS.map(lang => (
                                <TouchableOpacity
                                    key={lang}
                                    onPress={() => toggleLanguage(lang)}
                                >
                                    <Chip
                                        label={lang.charAt(0).toUpperCase() + lang.slice(1)}
                                        color={selectedLanguages.includes(lang) ? Colors.light.primary : '#E0E0E0'}
                                        size="small"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Location Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Location</Text>
                        <Text style={styles.sectionHint}>Filter by state/city</Text>
                        <View style={styles.chipsContainer}>
                            {LOCATION_OPTIONS.map(loc => (
                                <TouchableOpacity
                                    key={loc}
                                    onPress={() => setSelectedLocation(selectedLocation === loc ? '' : loc)}
                                >
                                    <Chip
                                        label={loc}
                                        color={selectedLocation === loc ? Colors.light.primary : '#E0E0E0'}
                                        size="small"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Apply Button */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                        <Text style={styles.applyButtonText}>
                            Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

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
    resetButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    resetText: {
        fontSize: 14,
        color: Colors.light.primary,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    sectionHint: {
        fontSize: 13,
        color: '#888',
        marginBottom: 12,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    applyButton: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FilterModal;
