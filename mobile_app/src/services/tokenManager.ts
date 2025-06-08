import { store } from '../store';
import { logoutUser } from '../features/auth/authSlice';
import { axiosInstance } from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TokenResponse {
    access: string;
    refresh: string;
}

class TokenManager {
    private static instance: TokenManager;
    private refreshPromise: Promise<TokenResponse | null> | null = null;

    private constructor() {
        this.setupAxiosInterceptors();
    }

    public static getInstance(): TokenManager {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager();
        }
        return TokenManager.instance;
    }

    private setupAxiosInterceptors(): void {
        // Перехватчик для обработки ошибок авторизации
        axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Если ошибка 401 и это не запрос на обновление токена
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        // Пробуем обновить токен
                        const newTokens = await this.refreshToken();
                        if (newTokens) {
                            // Повторяем запрос
                            return axiosInstance(originalRequest);
                        }
                    } catch (refreshError) {
                        // Если не удалось обновить токен, разлогиниваем пользователя
                        this.handleLogout();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    public async getAccessToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem('access_token');
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    }

    public async getRefreshToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem('refresh_token');
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    }

    public async setTokens(access: string, refresh: string): Promise<void> {
        try {
            await AsyncStorage.setItem('access_token', access);
            await AsyncStorage.setItem('refresh_token', refresh);
        } catch (error) {
            console.error('Error setting tokens:', error);
        }
    }

    public async setAccessToken(access: string): Promise<void> {
        try {
            await AsyncStorage.setItem('access_token', access);
        } catch (error) {
            console.error('Error setting access token:', error);
        }
    }

    public async removeTokens(): Promise<void> {
        try {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
        } catch (error) {
            console.error('Error removing tokens:', error);
        }
    }

    public async refreshToken(): Promise<TokenResponse | null> {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
            return null;
        }

        // Если уже есть запрос на обновление токена, возвращаем его промис
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        // Создаем новый промис для обновления токена
        this.refreshPromise = axiosInstance
            .post<TokenResponse>('/auth/token/refresh/', {
                refresh: refreshToken,
            })
            .then(async (response) => {
                const { access, refresh } = response.data;
                await this.setTokens(access, refresh);
                return response.data;
            })
            .catch((error) => {
                this.handleLogout();
                return null;
            })
            .finally(() => {
                this.refreshPromise = null;
            });

        return this.refreshPromise;
    }

    private async handleLogout(): Promise<void> {
        await this.removeTokens();
        store.dispatch(logoutUser());
    }
}

export const tokenManager = TokenManager.getInstance(); 