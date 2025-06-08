import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
    ProfileState, 
    UserProfile, 
    UserLocation, 
    UserPreferences 
} from '../../types/profile';
import {
    fetchProfile,
    fetchPublicProfile,
    updateProfile,
    uploadAvatar,
    fetchLocations,
    fetchPrimaryLocation,
    fetchPreferences,
    createLocation,
    updateLocation,
    deleteLocation,
    updatePreferences
} from './profileThunks';

const initialState: ProfileState = {
    profile: null,
    publicProfile: null,
    locations: [],
    preferences: null,
    primaryLocation: null,
    loading: false,
    error: null,
};

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        setProfile: (state, action: PayloadAction<UserProfile>) => {
            state.profile = action.payload;
            state.error = null;
        },
        setPublicProfile: (state, action: PayloadAction<UserProfile>) => {
            state.publicProfile = action.payload;
            state.error = null;
        },
        setLocations: (state, action: PayloadAction<UserLocation[]>) => {
            state.locations = action.payload;
            state.error = null;
        },
        setPrimaryLocation: (state, action: PayloadAction<UserLocation>) => {
            state.primaryLocation = action.payload;
            state.error = null;
        },
        setPreferences: (state, action: PayloadAction<UserPreferences>) => {
            state.preferences = action.payload;
            state.error = null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearProfile: (state) => {
            state.profile = null;
            state.publicProfile = null;
            state.locations = [];
            state.preferences = null;
            state.primaryLocation = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Получение профиля
            .addCase(fetchProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.profile = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Получение публичного профиля
            .addCase(fetchPublicProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPublicProfile.fulfilled, (state, action) => {
                state.publicProfile = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchPublicProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обновление профиля
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.profile = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Загрузка аватара
            .addCase(uploadAvatar.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadAvatar.fulfilled, (state, action) => {
                state.profile = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(uploadAvatar.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Получение списка локаций
            .addCase(fetchLocations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLocations.fulfilled, (state, action) => {
                state.locations = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchLocations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Получение основной локации
            .addCase(fetchPrimaryLocation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPrimaryLocation.fulfilled, (state, action) => {
                state.primaryLocation = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchPrimaryLocation.rejected, (state, action) => {
                state.loading = false;
                // Если основной локации нет, это не ошибка
                if (action.error.message?.includes('404')) {
                    state.primaryLocation = null;
                } else {
                    state.error = action.payload as string;
                }
            })
            
            // Получение предпочтений
            .addCase(fetchPreferences.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPreferences.fulfilled, (state, action) => {
                state.preferences = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchPreferences.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Создание локации
            .addCase(createLocation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createLocation.fulfilled, (state, action) => {
                state.locations = [...state.locations, action.payload];
                if (action.payload.is_primary) {
                    state.primaryLocation = action.payload;
                }
                state.loading = false;
                state.error = null;
            })
            .addCase(createLocation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обновление локации
            .addCase(updateLocation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateLocation.fulfilled, (state, action) => {
                const updatedLocation = action.payload;
                state.locations = state.locations.map(location => 
                    location.id === updatedLocation.id ? updatedLocation : location
                );
                
                if (updatedLocation.is_primary) {
                    state.primaryLocation = updatedLocation;
                } else if (
                    state.primaryLocation && 
                    state.primaryLocation.id === updatedLocation.id
                ) {
                    // Если текущая основная локация стала не основной
                    state.primaryLocation = null;
                }
                
                state.loading = false;
                state.error = null;
            })
            .addCase(updateLocation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Удаление локации
            .addCase(deleteLocation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteLocation.fulfilled, (state, action) => {
                const deletedId = action.meta.arg;
                state.locations = state.locations.filter(location => location.id !== deletedId);
                
                if (state.primaryLocation && state.primaryLocation.id === deletedId) {
                    state.primaryLocation = null;
                }
                
                state.loading = false;
                state.error = null;
            })
            .addCase(deleteLocation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обновление предпочтений
            .addCase(updatePreferences.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePreferences.fulfilled, (state, action) => {
                state.preferences = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(updatePreferences.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { 
    setProfile, 
    setPublicProfile, 
    setLocations, 
    setPrimaryLocation,
    setPreferences,
    setLoading, 
    setError, 
    clearProfile 
} = profileSlice.actions;

export default profileSlice.reducer; 