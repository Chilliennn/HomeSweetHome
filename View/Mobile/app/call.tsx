import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CallScreen } from '../CommunicationUI';

export default function CallRoute() {
    const params = useLocalSearchParams();
    const type = params.type as 'voice' | 'video';
    const url = params.url as string | undefined;

    return <CallScreen type={type} url={url} />;
}
