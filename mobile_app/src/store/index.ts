import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import categoriesReducer from '../features/categories/categoriesSlice';
import profileReducer from '../features/profile/profileSlice';
import itemsReducer from '../features/items/itemsSlice';
import tradesReducer from '../features/trades/tradesSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        categories: categoriesReducer,
        profile: profileReducer,
        items: itemsReducer,
        trades: tradesReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 