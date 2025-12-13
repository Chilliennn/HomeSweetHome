import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StageProgressionScreen } from '../../StageUI/StageProgression';

export default function StageProgressionRoute() {
  const { userId } = useLocalSearchParams();
  
  return <StageProgressionScreen userId={userId as string} />;
}