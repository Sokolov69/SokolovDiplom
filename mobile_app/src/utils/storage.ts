import AsyncStorage from '@react-native-async-storage/async-storage';

export const setToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem('access_token', token);
    } catch (error) {
        console.error('Error saving token:', error);
    }
};

export const getToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem('access_token');
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

export const removeToken = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem('access_token');
    } catch (error) {
        console.error('Error removing token:', error);
    }
}; 