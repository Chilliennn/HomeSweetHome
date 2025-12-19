/* eslint-disable @typescript-eslint/no-unused-vars */
// Stub for expo-file-system on web
export const EncodingType = {
    UTF8: 'utf8',
    Base64: 'base64',
};

export const readAsStringAsync = async (_uri: string, _options?: unknown) => {
    throw new Error('expo-file-system is not supported on web');
};

export const writeAsStringAsync = async (_uri: string, _contents: string, _options?: unknown) => {
    throw new Error('expo-file-system is not supported on web');
};

export const downloadAsync = async (_uri: string, _fileUri: string, _options?: unknown) => {
    throw new Error('expo-file-system is not supported on web');
};

export const getInfoAsync = async (_fileUri: string, _options?: unknown) => {
    throw new Error('expo-file-system is not supported on web');
};

export const documentDirectory = '';
