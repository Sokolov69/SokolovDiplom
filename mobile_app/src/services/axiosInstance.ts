import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Используем переменную окружения или fallback
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://92.255.111.223:8000/api';

export const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 секунд таймаут
});

// Добавляем интерцептор для автоматического добавления токена
axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Ошибка получения токена:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Добавляем интерцептор для обработки ошибок авторизации
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Токен истек, очищаем хранилище
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
        }
        return Promise.reject(error);
    }
); 
