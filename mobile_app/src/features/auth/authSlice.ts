import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types/auth';
import { register, login, logout, checkAuth, updateUser, changePassword } from './authThunks';
import { getToken } from '../../utils/storage';

const initialState: AuthState = {
    user: null,
    token: null,
    error: null,
    validationErrors: null,
    loading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.error = null;
            state.validationErrors = null;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setValidationErrors: (state, action: PayloadAction<Record<string, string[]> | null>) => {
            state.validationErrors = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        logoutUser: (state) => {
            state.user = null;
            state.token = null;
            state.error = null;
            state.validationErrors = null;
        },
        clearAllState: (state) => {
            return {
                ...initialState,
                loading: false,
            };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.validationErrors = null;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                console.log('[authSlice] checkAuth.fulfilled');
                console.log('[authSlice] CheckAuth data:', action.payload);
                
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
                state.validationErrors = null;
                
                console.log('[authSlice] State after checkAuth - user:', state.user?.username, 'loading:', state.loading);
                
                if (action.payload.user) {
                    const { roles, highest_role } = action.payload.user;
                    console.log('User roles from check auth:', roles);
                    console.log('Highest role from check auth:', highest_role);
                }
            })
            .addCase(checkAuth.rejected, (state, action) => {
                console.log('[authSlice] checkAuth.rejected');
                console.log('[authSlice] CheckAuth error:', action.payload);
                
                state.loading = false;
                state.user = null;
                state.token = null;
                state.validationErrors = null;
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.validationErrors = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.loading = false;
                state.error = null;
                state.validationErrors = null;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                if (typeof action.payload === 'object' && action.payload !== null && !Array.isArray(action.payload)) {
                    state.validationErrors = action.payload as Record<string, string[]>;
                    state.error = null;
                } else {
                    state.error = action.payload as string;
                    state.validationErrors = null;
                }
            })
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.validationErrors = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                console.log('[authSlice] login.fulfilled - setting user data');
                console.log('[authSlice] User data:', action.payload.user);
                
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
                state.validationErrors = null;
                
                console.log('[authSlice] State after login - user:', state.user?.username, 'loading:', state.loading);
                
                if (action.payload.user) {
                    const { roles, highest_role } = action.payload.user;
                    console.log('User roles:', roles);
                    console.log('Highest role:', highest_role);
                }
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.validationErrors = null;
            })
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.loading = false;
                state.error = null;
                state.validationErrors = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.validationErrors = null;
            })
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.validationErrors = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) {
                    state.user = { ...state.user, ...action.payload };
                }
                state.error = null;
                state.validationErrors = null;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.validationErrors = null;
            })
            .addCase(changePassword.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.validationErrors = null;
            })
            .addCase(changePassword.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
                state.validationErrors = null;
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.loading = false;
                if (typeof action.payload === 'object' && action.payload !== null && !Array.isArray(action.payload)) {
                    state.validationErrors = action.payload as Record<string, string[]>;
                    state.error = null;
                } else {
                    state.error = action.payload as string;
                    state.validationErrors = null;
                }
            });
    },
});

export const { setUser, setError, setValidationErrors, setLoading, logoutUser, clearAllState } = authSlice.actions;
export default authSlice.reducer; 