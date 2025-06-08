import { axiosInstance } from './axiosInstance';
import { 
    UserProfile, 
    UserLocation, 
    UserPreferences,
    UpdateProfileData,
    UpdateAvatarData,
    CreateLocationData,
    UpdateLocationData,
    UpdatePreferencesData
} from '../types/profile';

export const profileAPI = {
    // Профиль пользователя
    getProfile: async (): Promise<UserProfile> => {
        console.log('Запрос на получение профиля пользователя');
        try {
            const response = await axiosInstance.get('/profiles/profile/me/');
            console.log('Получен профиль пользователя:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении профиля:', error);
            throw error;
        }
    },

    getPublicProfile: async (userId: number): Promise<UserProfile> => {
        console.log(`Запрос на получение публичного профиля пользователя с ID ${userId}`);
        try {
            const response = await axiosInstance.get(`/profiles/profile/public/${userId}/`);
            console.log('Получен публичный профиль пользователя:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Ошибка при получении публичного профиля пользователя с ID ${userId}:`, error);
            throw error;
        }
    },

    updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
        console.log('Обновление профиля пользователя:', data);
        try {
            // Получаем id текущего профиля
            const profile = await profileAPI.getProfile();
            const response = await axiosInstance.patch(`/profiles/profile/${profile.id}/`, data);
            console.log('Профиль успешно обновлен:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при обновлении профиля:', error);
            throw error;
        }
    },

    uploadAvatar: async (data: UpdateAvatarData): Promise<UserProfile> => {
        console.log('Загрузка аватара пользователя');
        try {
            const formData = new FormData();
            formData.append('avatar', data.avatar);

            const response = await axiosInstance.post('/profiles/profile/avatar/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            console.log('Аватар успешно загружен:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при загрузке аватара:', error);
            throw error;
        }
    },

    // Адреса пользователя
    getLocations: async (): Promise<UserLocation[]> => {
        console.log('Запрос на получение адресов пользователя');
        try {
            const response = await axiosInstance.get('/profiles/locations/');
            console.log('Получены адреса пользователя:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении адресов:', error);
            throw error;
        }
    },

    getLocationById: async (id: number): Promise<UserLocation> => {
        console.log(`Запрос на получение адреса с ID ${id}`);
        try {
            const response = await axiosInstance.get(`/profiles/locations/${id}/`);
            console.log('Получен адрес:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Ошибка при получении адреса с ID ${id}:`, error);
            throw error;
        }
    },

    getPrimaryLocation: async (): Promise<UserLocation> => {
        console.log('Запрос на получение основного адреса пользователя');
        try {
            const response = await axiosInstance.get('/profiles/locations/primary/');
            console.log('Получен основной адрес:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении основного адреса:', error);
            throw error;
        }
    },

    createLocation: async (data: CreateLocationData): Promise<UserLocation> => {
        console.log('Создание нового адреса:', data);
        try {
            const response = await axiosInstance.post('/profiles/locations/', data);
            console.log('Адрес успешно создан:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при создании адреса:', error);
            throw error;
        }
    },

    updateLocation: async (id: number, data: UpdateLocationData): Promise<UserLocation> => {
        console.log(`Обновление адреса с ID ${id}:`, data);
        try {
            const response = await axiosInstance.patch(`/profiles/locations/${id}/`, data);
            console.log('Адрес успешно обновлен:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Ошибка при обновлении адреса с ID ${id}:`, error);
            throw error;
        }
    },

    deleteLocation: async (id: number): Promise<void> => {
        console.log(`Удаление адреса с ID ${id}`);
        try {
            await axiosInstance.delete(`/profiles/locations/${id}/`);
            console.log(`Адрес с ID ${id} успешно удален`);
        } catch (error: any) {
            console.error(`Ошибка при удалении адреса с ID ${id}:`, error);
            throw error;
        }
    },

    // Предпочтения пользователя
    getPreferences: async (): Promise<UserPreferences> => {
        console.log('Запрос на получение предпочтений пользователя');
        try {
            const response = await axiosInstance.get('/profiles/preferences/');
            console.log('Получены предпочтения пользователя:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении предпочтений:', error);
            throw error;
        }
    },

    updatePreferences: async (data: UpdatePreferencesData): Promise<UserPreferences> => {
        console.log('Обновление предпочтений пользователя:', data);
        try {
            // Получаем id текущих предпочтений
            const preferences = await profileAPI.getPreferences();
            const response = await axiosInstance.patch(`/profiles/preferences/${preferences.id}/`, data);
            console.log('Предпочтения успешно обновлены:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при обновлении предпочтений:', error);
            throw error;
        }
    }
}; 