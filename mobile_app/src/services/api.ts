import { LoginData, RegisterData, AuthState, User, UpdateUserData, ChangePasswordData } from '../types/auth';
import { tokenManager } from './tokenManager';
import { axiosInstance } from './axiosInstance';

// Добавляем перехватчик для добавления токена в заголовок
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await tokenManager.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Перехватчик для обработки ошибок и обновления токена при необходимости
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Если ошибка 401 (Unauthorized) и запрос ещё не повторялся
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Пробуем обновить токен
                const refreshToken = await tokenManager.getRefreshToken();
                if (refreshToken) {
                    const refreshResponse = await axiosInstance.post('/auth/token/refresh/', {
                        refresh: refreshToken
                    });
                    const { access } = refreshResponse.data;
                    
                    // Сохраняем новый токен
                    await tokenManager.setTokens(access, refreshToken);
                    
                    // Обновляем заголовок и повторяем запрос
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                console.error('Ошибка обновления токена:', refreshError);
                // Если не удалось обновить токен, выходим из системы
                await tokenManager.removeTokens();
                // Здесь можно было бы добавить перенаправление на страницу входа
            }
        }
        
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: async (data: LoginData): Promise<AuthState> => {
        console.log('Отправка запроса на вход:', { username: data.username });
        try {
            const response = await axiosInstance.post('/auth/token/', data);
            console.log('Получен ответ на вход:', response.data);
            const { access, refresh } = response.data;
            await tokenManager.setTokens(access, refresh);
            
            const userResponse = await authAPI.getProfile();
            console.log('API: Get user response:', userResponse);
            return {
                user: userResponse,
                token: access,
                error: null,
                validationErrors: null,
                loading: false
            };
        } catch (error: any) {
            console.error('Ошибка при входе:', error);
            throw error;
        }
    },

    register: async (data: RegisterData): Promise<AuthState> => {
        console.log('Отправка запроса на регистрацию:', { 
            username: data.username,
            email: data.email,
            first_name: data.first_name || '',
            last_name: data.last_name || ''
        });
        try {
            const response = await axiosInstance.post('/auth/register/', data);
            console.log('Получен ответ на регистрацию:', response.data);
            return {
                user: response.data,
                token: null,
                error: null,
                validationErrors: null,
                loading: false
            };
        } catch (error: any) {
            console.error('Ошибка при регистрации:', error);
            console.error('Ошибка ответа при регистрации:', error.response?.data);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        console.log('Выход из системы');
        try {
            await tokenManager.removeTokens();
            console.log('Токены успешно удалены');
        } catch (error: any) {
            console.error('Ошибка при выходе:', error);
            throw error;
        }
    },

    getProfile: async (): Promise<User> => {
        console.log('Отправка запроса на получение профиля пользователя');
        try {
            const response = await axiosInstance.get('/auth/me/');
            console.log('Получен ответ с данными пользователя:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении данных пользователя:', error);
            throw error;
        }
    },

    refreshToken: async (refreshToken: string): Promise<string> => {
        try {
            const response = await axiosInstance.post('/auth/token/refresh/', {
                refresh: refreshToken
            });
            const { access } = response.data;
            return access;
        } catch (error: any) {
            console.error('Ошибка при обновлении токена:', error);
            throw error;
        }
    },

    checkAuth: async (): Promise<AuthState> => {
        console.log('API: Check auth request');
        try {
            const user = await authAPI.getProfile();
            const token = await tokenManager.getAccessToken();
            console.log('API: Check auth response:', { user, token });
            return {
                user,
                token,
                error: null,
                validationErrors: null,
                loading: false
            };
        } catch (error: any) {
            console.error('Ошибка при проверке авторизации:', error);
            throw error;
        }
    },

    // Обновление данных пользователя
    updateUser: async (data: UpdateUserData): Promise<User> => {
        console.log('Обновление данных пользователя:', data);
        try {
            const response = await axiosInstance.patch('/auth/me/', data);
            console.log('Данные пользователя обновлены:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при обновлении данных пользователя:', error);
            throw error;
        }
    },

    // Смена пароля
    changePassword: async (data: ChangePasswordData): Promise<{ detail: string }> => {
        console.log('Смена пароля пользователя');
        try {
            const response = await axiosInstance.post('/auth/password/change/', data);
            console.log('Пароль успешно изменен:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при смене пароля:', error);
            throw error;
        }
    },
}; 