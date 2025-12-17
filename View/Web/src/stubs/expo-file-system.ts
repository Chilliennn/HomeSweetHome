// Stub for expo-file-system on web
export const EncodingType = {
    UTF8: 'utf8',
    Base64: 'base64',
};

export const readAsStringAsync = async (uri: string, options?: any) => {
    throw new Error('expo-file-system is not supported on web');
};

export const writeAsStringAsync = async (uri: string, contents: string, options?: any) => {
    throw new Error('expo-file-system is not supported on web');
};

export const downloadAsync = async (uri: string, fileUri: string, options?: any) => {
    throw new Error('expo-file-system is not supported on web');
};

export const getInfoAsync = async (fileUri: string, options?: any) => {
    throw new Error('expo-file-system is not supported on web');
};

export const documentDirectory = '';
