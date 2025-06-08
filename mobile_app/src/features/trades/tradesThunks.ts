import { createAsyncThunk } from '@reduxjs/toolkit';
import { tradeService } from '../../services/tradeService';
import { 
    TradeStatus, 
    TradeOffer, 
    CreateTradeOfferData, 
    TradeActionData,
    TradeOfferFilter,
    TradeOfferPaginatedResponse 
} from '../../types/trade';
import { fetchProfile } from '../profile/profileThunks';

// Получение статусов обменов
export const fetchTradeStatuses = createAsyncThunk(
    'trades/fetchStatuses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await tradeService.getStatuses();
            return response.results;
        } catch (error: any) {
            console.error('Ошибка получения статусов обменов:', error);
            return rejectWithValue(
                error.response?.data?.detail || 
                error.response?.data?.message || 
                'Ошибка получения статусов обменов'
            );
        }
    }
);

// Создание предложения обмена
export const createTradeOffer = createAsyncThunk(
    'trades/createOffer',
    async (data: CreateTradeOfferData, { rejectWithValue }) => {
        try {
            const offer = await tradeService.createOffer(data);
            return offer;
        } catch (error: any) {
            console.error('Ошибка создания предложения обмена:', error);
            return rejectWithValue(
                error.response?.data?.detail || 
                error.response?.data?.message || 
                'Ошибка создания предложения обмена'
            );
        }
    }
);

// Получение списка предложений
export const fetchTradeOffers = createAsyncThunk(
    'trades/fetchOffers',
    async (filter: TradeOfferFilter = {}, { rejectWithValue }) => {
        try {
            const response = await tradeService.getOffers(filter);
            return response;
        } catch (error: any) {
            console.error('Ошибка получения предложений обмена:', error);
            return rejectWithValue(
                error.response?.data?.detail || 
                error.response?.data?.message || 
                'Ошибка получения предложений обмена'
            );
        }
    }
);

// Получение предложения по ID
export const fetchTradeOfferById = createAsyncThunk(
    'trades/fetchOfferById',
    async (offerId: number, { rejectWithValue }) => {
        try {
            const offer = await tradeService.getOfferById(offerId);
            return offer;
        } catch (error: any) {
            console.error('Ошибка получения предложения обмена:', error);
            return rejectWithValue(
                error.response?.data?.detail || 
                error.response?.data?.message || 
                'Ошибка получения предложения обмена'
            );
        }
    }
);

// Принятие предложения
export const acceptTradeOffer = createAsyncThunk(
    'trades/acceptOffer',
    async ({ offerId, data }: { offerId: number; data?: TradeActionData }, { rejectWithValue, dispatch }) => {
        try {
            const result = await tradeService.acceptOffer(offerId, data);
            // Обновляем предложение после принятия
            await dispatch(fetchTradeOfferById(offerId));
            return result;
        } catch (error: any) {
            console.error('Ошибка принятия предложения:', error);
            return rejectWithValue(
                error.response?.data?.detail || 
                error.response?.data?.message || 
                'Ошибка принятия предложения'
            );
        }
    }
);

// Отклонение предложения
export const rejectTradeOffer = createAsyncThunk(
    'trades/rejectOffer',
    async ({ offerId, data }: { offerId: number; data?: TradeActionData }, { rejectWithValue, dispatch }) => {
        try {
            const result = await tradeService.rejectOffer(offerId, data);
            // Обновляем предложение после отклонения
            await dispatch(fetchTradeOfferById(offerId));
            return result;
        } catch (error: any) {
            console.error('Ошибка отклонения предложения:', error);
            return rejectWithValue(
                error.response?.data?.detail || 
                error.response?.data?.message || 
                'Ошибка отклонения предложения'
            );
        }
    }
);

// Отмена предложения
export const cancelTradeOffer = createAsyncThunk(
    'trades/cancelOffer',
    async ({ offerId, data }: { offerId: number; data?: TradeActionData }, { rejectWithValue, dispatch }) => {
        try {
            const result = await tradeService.cancelOffer(offerId, data);
            // Обновляем предложение после отмены
            await dispatch(fetchTradeOfferById(offerId));
            return result;
        } catch (error: any) {
            console.error('Ошибка отмены предложения:', error);
            return rejectWithValue(
                error.response?.data?.detail || 
                error.response?.data?.message || 
                'Ошибка отмены предложения'
            );
        }
    }
);

// Завершение обмена
export const completeTradeOffer = createAsyncThunk(
    'trades/completeOffer',
    async ({ offerId, data }: { offerId: number; data?: TradeActionData }, { rejectWithValue, dispatch }) => {
        try {
            const result = await tradeService.completeOffer(offerId, data);
            // Обновляем предложение после завершения
            await dispatch(fetchTradeOfferById(offerId));
            
            // Обновляем профиль пользователя, чтобы показать новый счетчик successful_trades
            await dispatch(fetchProfile());
            
            return result;
        } catch (error: any) {
            console.error('Ошибка завершения обмена:', error);
            return rejectWithValue(
                error.response?.data?.detail || 
                error.response?.data?.message || 
                'Ошибка завершения обмена'
            );
        }
    }
); 