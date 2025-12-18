/* eslint-disable @typescript-eslint/no-unused-vars */
// Stub for expo-media-library on web
export const createAssetAsync = async (_localUri: string) => {
    throw new Error('expo-media-library is not supported on web');
};

export const requestPermissionsAsync = async () => {
    return { status: 'granted' };
};
