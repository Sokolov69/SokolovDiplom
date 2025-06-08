import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TradeState, TradeOffer, TradeStatus } from '../../types/trade';
import {
    fetchTradeStatuses,
    createTradeOffer,
    fetchTradeOffers,
    fetchTradeOfferById,
    acceptTradeOffer,
    rejectTradeOffer,
    cancelTradeOffer,
    completeTradeOffer
} from './tradesThunks';

const initialState: TradeState = {
    offers: [],
    currentOffer: null,
    statuses: [],
    pagination: {
        total: 0,
        nextPage: null,
        prevPage: null,
    },
    loading: false,
    error: null,
    actionLoading: false,
};

const tradesSlice = createSlice({
    name: 'trades',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentOffer: (state) => {
            state.currentOffer = null;
        },
        setCurrentOffer: (state, action: PayloadAction<TradeOffer>) => {
            state.currentOffer = action.payload;
        },
        clearTrades: (state) => {
            state.offers = [];
            state.currentOffer = null;
            state.statuses = [];
            state.pagination = {
                total: 0,
                nextPage: null,
                prevPage: null,
            };
            state.error = null;
            state.actionLoading = false;
        },
    },
    extraReducers: (builder) => {
        // Получение статусов обменов
        builder
            .addCase(fetchTradeStatuses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTradeStatuses.fulfilled, (state, action) => {
                state.loading = false;
                state.statuses = action.payload;
            })
            .addCase(fetchTradeStatuses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Создание предложения обмена
        builder
            .addCase(createTradeOffer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTradeOffer.fulfilled, (state, action) => {
                state.loading = false;
                state.offers.unshift(action.payload); // Добавляем в начало списка
                state.currentOffer = action.payload;
            })
            .addCase(createTradeOffer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Получение списка предложений
        builder
            .addCase(fetchTradeOffers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTradeOffers.fulfilled, (state, action) => {
                state.loading = false;
                state.offers = action.payload.results;
                state.pagination = {
                    total: action.payload.count,
                    nextPage: action.payload.next,
                    prevPage: action.payload.previous,
                };
            })
            .addCase(fetchTradeOffers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Получение предложения по ID
        builder
            .addCase(fetchTradeOfferById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTradeOfferById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOffer = action.payload;
                
                // Обновляем предложение в списке, если оно там есть
                const index = state.offers.findIndex(offer => offer.id === action.payload.id);
                if (index !== -1) {
                    state.offers[index] = action.payload;
                }
            })
            .addCase(fetchTradeOfferById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Принятие предложения
        builder
            .addCase(acceptTradeOffer.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(acceptTradeOffer.fulfilled, (state, action) => {
                state.actionLoading = false;
            })
            .addCase(acceptTradeOffer.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload as string;
            });

        // Отклонение предложения
        builder
            .addCase(rejectTradeOffer.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(rejectTradeOffer.fulfilled, (state, action) => {
                state.actionLoading = false;
            })
            .addCase(rejectTradeOffer.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload as string;
            });

        // Отмена предложения
        builder
            .addCase(cancelTradeOffer.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(cancelTradeOffer.fulfilled, (state, action) => {
                state.actionLoading = false;
            })
            .addCase(cancelTradeOffer.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload as string;
            });

        // Завершение обмена
        builder
            .addCase(completeTradeOffer.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(completeTradeOffer.fulfilled, (state, action) => {
                state.actionLoading = false;
            })
            .addCase(completeTradeOffer.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, clearCurrentOffer, setCurrentOffer, clearTrades } = tradesSlice.actions;
export default tradesSlice.reducer; 