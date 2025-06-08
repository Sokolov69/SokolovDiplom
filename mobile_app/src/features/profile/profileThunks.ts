import { createAsyncThunk } from '@reduxjs/toolkit';
import { profileAPI } from '../../services/profileService';
import { 
    UserProfile, 
    UserLocation, 
    UserPreferences,
    UpdateProfileData,
    UpdateAvatarData,
    CreateLocationData,
    UpdateLocationData,
    UpdatePreferencesData
} from '../../types/profile';

// Получение профиля пользователя
export const fetchProfile = createAsyncThunk<UserProfile>(
    'profile/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение профиля пользователя');
            const response = await profileAPI.getProfile();
            console.log('Thunk: Профиль пользователя получен:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении профиля:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить профиль';
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение публичного профиля пользователя по ID
export const fetchPublicProfile = createAsyncThunk<UserProfile, number>(
    'profile/fetchPublicProfile',
    async (userId, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Запрос на получение публичного профиля пользователя с ID ${userId}`);
            const response = await profileAPI.getPublicProfile(userId);
            console.log('Thunk: Публичный профиль пользователя получен:', response);
            return response;
        } catch (error: any) {
            console.error(`Thunk: Ошибка при получении публичного профиля пользователя с ID ${userId}:`, error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить профиль пользователя';
            return rejectWithValue(errorMessage);
        }
    }
);

// Обновление профиля пользователя
export const updateProfile = createAsyncThunk<UserProfile, UpdateProfileData>(
    'profile/updateProfile',
    async (data, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на обновление профиля пользователя:', data);
            const response = await profileAPI.updateProfile(data);
            console.log('Thunk: Профиль пользователя обновлен:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при обновлении профиля:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось обновить профиль';
            return rejectWithValue(errorMessage);
        }
    }
);

// Загрузка аватара пользователя
export const uploadAvatar = createAsyncThunk<UserProfile, UpdateAvatarData>(
    'profile/uploadAvatar',
    async (data, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на загрузку аватара пользователя');
            const response = await profileAPI.uploadAvatar(data);
            console.log('Thunk: Аватар пользователя загружен:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при загрузке аватара:', error);
            let errorMessage = 'Не удалось загрузить аватар';
            
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data.avatar) {
                    errorMessage = Array.isArray(error.response.data.avatar) 
                        ? error.response.data.avatar.join(', ') 
                        : error.response.data.avatar;
                }
            }
            
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение списка локаций пользователя
export const fetchLocations = createAsyncThunk<UserLocation[]>(
    'profile/fetchLocations',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение адресов пользователя');
            const response = await profileAPI.getLocations();
            console.log('Thunk: Адреса пользователя получены:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении адресов:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить адреса';
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение основной локации пользователя
export const fetchPrimaryLocation = createAsyncThunk<UserLocation>(
    'profile/fetchPrimaryLocation',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение основного адреса пользователя');
            const response = await profileAPI.getPrimaryLocation();
            console.log('Thunk: Основной адрес пользователя получен:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении основного адреса:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить основной адрес';
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение предпочтений пользователя
export const fetchPreferences = createAsyncThunk<UserPreferences>(
    'profile/fetchPreferences',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение предпочтений пользователя');
            const response = await profileAPI.getPreferences();
            console.log('Thunk: Предпочтения пользователя получены:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении предпочтений:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить предпочтения';
            return rejectWithValue(errorMessage);
        }
    }
);

// Создание новой локации пользователя
export const createLocation = createAsyncThunk<UserLocation, CreateLocationData>(
    'profile/createLocation',
    async (data, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на создание адреса пользователя:', data);
            const response = await profileAPI.createLocation(data);
            console.log('Thunk: Адрес пользователя создан:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при создании адреса:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось создать адрес';
            return rejectWithValue(errorMessage);
        }
    }
);

// Обновление локации пользователя
export const updateLocation = createAsyncThunk<
    UserLocation, 
    { id: number; data: UpdateLocationData }
>(
    'profile/updateLocation',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Запрос на обновление адреса пользователя с ID ${id}:`, data);
            const response = await profileAPI.updateLocation(id, data);
            console.log('Thunk: Адрес пользователя обновлен:', response);
            return response;
        } catch (error: any) {
            console.error(`Thunk: Ошибка при обновлении адреса с ID ${id}:`, error);
            const errorMessage = error.response?.data?.detail || 'Не удалось обновить адрес';
            return rejectWithValue(errorMessage);
        }
    }
);

// Удаление локации пользователя
export const deleteLocation = createAsyncThunk<void, number>(
    'profile/deleteLocation',
    async (id, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Запрос на удаление адреса пользователя с ID ${id}`);
            await profileAPI.deleteLocation(id);
            console.log(`Thunk: Адрес пользователя с ID ${id} удален`);
        } catch (error: any) {
            console.error(`Thunk: Ошибка при удалении адреса с ID ${id}:`, error);
            const errorMessage = error.response?.data?.detail || 'Не удалось удалить адрес';
            return rejectWithValue(errorMessage);
        }
    }
);

// Обновление предпочтений пользователя
export const updatePreferences = createAsyncThunk<UserPreferences, UpdatePreferencesData>(
    'profile/updatePreferences',
    async (data, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на обновление предпочтений пользователя:', data);
            const response = await profileAPI.updatePreferences(data);
            console.log('Thunk: Предпочтения пользователя обновлены:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при обновлении предпочтений:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось обновить предпочтения';
            return rejectWithValue(errorMessage);
        }
    }
); 