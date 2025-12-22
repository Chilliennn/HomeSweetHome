/**
 * Edit Profile Info Screen
 * 
 * Route: /(auth)/edit-profile-info
 * 
 * This screen allows users to edit their interests, self-introduction, and languages
 * AFTER the initial profile setup. It reuses ProfileInfoForm component.
 * 
 * MVVM Architecture:
 * - Reuses ProfileInfoForm component (same as profile-setup flow)
 * - Loads existing data from authViewModel
 * - Saves via authViewModel.saveProfileInfo()
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { authViewModel } from '@home-sweet-home/viewmodel';
import { ProfileInfoForm } from './ProfileInfoForm';
import type { ProfileInfoData } from './ProfileInfoForm';

// ============================================================================
// SCREEN COMPONENT
// ============================================================================
const EditProfileInfoScreenComponent: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const loadedRef = useRef(false);

    const userId = params.userId as string;
    const [initialData, setInitialData] = useState<Partial<ProfileInfoData> | undefined>(undefined);
    const [isReady, setIsReady] = useState(false);

    // Load existing profile data on mount
    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;

        const loadData = async () => {
            if (userId) {
                console.log('[EditProfileInfoScreen] Loading profile data for:', userId);
                await authViewModel.getCurrentUser(userId);

                const user = authViewModel.currentUser;
                if (user?.profile_data) {
                    setInitialData({
                        interests: user.profile_data.interests || [],
                        selfIntroduction: user.profile_data.self_introduction || '',
                        languages: user.languages || [],
                        customInterests: [],
                        customLanguages: [],
                    });
                }
                setIsReady(true);
            }
        };

        loadData();
    }, [userId]);

    // Handle form submission
    const handleSubmit = async (data: ProfileInfoData) => {
        if (!userId) {
            Alert.alert('Error', 'User ID is missing');
            return;
        }

        console.log('[EditProfileInfoScreen] Saving profile info:', data);

        try {
            await authViewModel.saveProfileInfo(userId, {
                interests: data.interests,
                customInterests: data.customInterests,
                selfIntroduction: data.selfIntroduction,
                languages: data.languages,
                customLanguages: data.customLanguages,
            });

            Alert.alert('Success', 'Profile info updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('[EditProfileInfoScreen] Save error:', error);
            Alert.alert('Error', error?.message || 'Failed to save profile info');
        }
    };

    // Handle back navigation
    const handleBack = () => {
        router.back();
    };

    // Show nothing while loading
    if (!isReady) {
        return <View style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            <ProfileInfoForm
                initialData={initialData}
                onSubmit={handleSubmit}
                onBack={handleBack}
                isLoading={authViewModel.isLoading}
                editMode={true}
            />
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6',
    },
});

export const EditProfileInfoScreen = observer(EditProfileInfoScreenComponent);
export default EditProfileInfoScreen;
