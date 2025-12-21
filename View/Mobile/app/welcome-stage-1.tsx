/**
 * Welcome to Stage 1 Route
 * Routes to: /welcome-stage-1
 * Shown after elderly accepts application and relationship starts
 */
import React from 'react';
import { useRouter } from 'expo-router';
import { WelcomeToStage1 } from '@/StageUI/WelcomeToStage1';
import { communicationViewModel } from '@home-sweet-home/viewmodel';

export default function WelcomeStage1Screen() {
    const router = useRouter();
    const vm = communicationViewModel;

    // Get partner name from relationship partner user (loaded by checkActiveRelationship)
    // or from current chat partner user (for pre-match context)
    const partnerName = vm.relationshipPartnerUser?.full_name
        || vm.currentChat?.partnerUser?.full_name
        || 'Your Partner';

    const handleStartJourney = () => {
        console.log('[WelcomeStage1] Start Journey pressed, navigating to home...');
        // Navigate to main home page (which will show StageProgression for relationship users)
        router.replace('/(main)/home' as any);
    };

    return (
        <WelcomeToStage1
            partnerName={partnerName}
            onStartJourney={handleStartJourney}
        />
    );
}
