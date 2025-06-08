import { createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { AuthState, LoginData, RegisterData, UpdateUserData, ChangePasswordData, User } from '../../types/auth';
import { tokenManager } from '../../services/tokenManager';

export const checkAuth = createAsyncThunk<AuthState>(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Check auth attempt');
            const response = await authAPI.checkAuth();
            console.log('Check auth response:', response);
            return response;
        } catch (error: any) {
            console.error('Check auth error:', error);
            return rejectWithValue(error.response?.data?.detail || 'Ошибка проверки авторизации');
        }
    }
);

export const login = createAsyncThunk<AuthState, LoginData>(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            console.log('Login attempt with:', credentials);
            const response = await authAPI.login(credentials);
            console.log('Login response:', response);
            return response;
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.detail 
                || (typeof error.response?.data === 'string' ? error.response.data : 'Ошибка авторизации');
            return rejectWithValue(errorMessage);
        }
    }
);

export const register = createAsyncThunk<AuthState, RegisterData>(
    'auth/register',
    async (data, { rejectWithValue }) => {
        try {
            console.log('Register attempt with:', { 
                username: data.username,
                email: data.email,
                first_name: data.first_name || '',
                last_name: data.last_name || ''
            });
            
            // Создаем объект данных с обязательными полями
            const registrationData: any = {
                username: data.username,
                email: data.email,
                password: data.password,
                password2: data.password2,
            };
            
            // Добавляем необязательные поля, только если они заполнены
            if (data.first_name) {
                registrationData.first_name = data.first_name;
            }
            
            if (data.last_name) {
                registrationData.last_name = data.last_name;
            }
            
            const response = await authAPI.register(registrationData);
            console.log('Register response:', response);
            
            // После успешной регистрации выполняем вход
            if (response.user) {
                try {
                    const loginData = {
                        username: data.username,
                        password: data.password,
                    };
                    const loginResponse = await authAPI.login(loginData);
                    return loginResponse;
                } catch (loginError: any) {
                    console.error('Login after registration error:', loginError);
                    // В случае ошибки входа, возвращаем исходный ответ регистрации
                    return response;
                }
            }
            
            return response;
        } catch (error: any) {
            console.error('Register error:', error);
            console.error('Register error response:', error.response?.data);
            
            // Обработка различных форматов ошибок от API
            if (error.response?.data) {
                if (typeof error.response.data === 'object' && !error.response.data.detail) {
                    // Это ошибки валидации полей - возвращаем их как есть
                    return rejectWithValue(error.response.data);
                } else if (error.response.data.detail) {
                    return rejectWithValue(error.response.data.detail);
                } else if (typeof error.response.data === 'string') {
                    return rejectWithValue(error.response.data);
                }
            }
            
            return rejectWithValue('Ошибка регистрации');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Logout attempt');
            await authAPI.logout();
            console.log('Logout successful');
        } catch (error: any) {
            console.error('Logout error:', error);
            return rejectWithValue(error.response?.data?.detail || 'Ошибка выхода');
        }
    }
);

export const updateUser = createAsyncThunk<User, UpdateUserData>(
    'auth/updateUser',
    async (data, { rejectWithValue }) => {
        try {
            console.log('Update user attempt with:', data);
            const response = await authAPI.updateUser(data);
            console.log('Update user response:', response);
            return response;
        } catch (error: any) {
            console.error('Update user error:', error);
            const errorMessage = error.response?.data?.detail 
                || (typeof error.response?.data === 'string' ? error.response.data : 'Ошибка обновления данных');
            return rejectWithValue(errorMessage);
        }
    }
);

export const changePassword = createAsyncThunk<{ detail: string }, ChangePasswordData>(
    'auth/changePassword',
    async (data, { rejectWithValue }) => {
        try {
            console.log('Change password attempt');
            const response = await authAPI.changePassword(data);
            console.log('Change password response:', response);
            return response;
        } catch (error: any) {
            console.error('Change password error:', error);
            if (error.response?.data) {
                // Если есть ошибки валидации полей
                if (typeof error.response.data === 'object' && !error.response.data.detail) {
                    return rejectWithValue(error.response.data);
                } else if (error.response.data.detail) {
                    return rejectWithValue(error.response.data.detail);
                }
            }
            return rejectWithValue('Ошибка смены пароля');
        }
    }
); 