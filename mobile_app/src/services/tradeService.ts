import { axiosInstance } from './axiosInstance';
import { 
    TradeStatus, 
    TradeOffer, 
    CreateTradeOfferData, 
    TradeActionData,
    TradeOfferFilter,
    TradeOfferPaginatedResponse,
    ParticipantLocations
} from '../types/trade';

export const tradeService = {
    // Получение статусов обменов
    getStatuses: async (): Promise<{ results: TradeStatus[] }> => {
        console.log('TradeService: Получение статусов обменов');
        try {
            const response = await axiosInstance.get('/trades/statuses/');
            console.log('TradeService: Статусы получены:', response.data);
            return response.data;
        } catch (error) {
            console.error('TradeService: Ошибка получения статусов:', error);
            throw error;
        }
    },

    // Создание предложения обмена
    createOffer: async (data: CreateTradeOfferData): Promise<TradeOffer> => {
        console.log('TradeService: Создание предложения обмена:', data);
        try {
            const response = await axiosInstance.post('/trades/offers/', data);
            console.log('TradeService: Предложение создано:', response.data);
            return response.data;
        } catch (error) {
            console.error('TradeService: Ошибка создания предложения:', error);
            throw error;
        }
    },

    // Получение списка предложений
    getOffers: async (filter: TradeOfferFilter = {}): Promise<TradeOfferPaginatedResponse> => {
        console.log('TradeService: Получение предложений с фильтром:', filter);
        try {
            const params = new URLSearchParams();
            if (filter.type) params.append('type', filter.type);
            if (filter.page) params.append('page', filter.page.toString());

            const response = await axiosInstance.get(`/trades/offers/?${params.toString()}`);
            console.log('TradeService: Предложения получены:', response.data);
            return response.data;
        } catch (error) {
            console.error('TradeService: Ошибка получения предложений:', error);
            throw error;
        }
    },

    // Получение детальной информации о предложении
    getOfferById: async (offerId: number): Promise<TradeOffer> => {
        console.log('TradeService: Получение предложения по ID:', offerId);
        try {
            const response = await axiosInstance.get(`/trades/offers/${offerId}/`);
            console.log('TradeService: Предложение получено:', response.data);
            return response.data;
        } catch (error) {
            console.error('TradeService: Ошибка получения предложения:', error);
            throw error;
        }
    },

    // Принятие предложения
    acceptOffer: async (offerId: number, data: TradeActionData = {}): Promise<{ success: boolean; message: string }> => {
        console.log('TradeService: Принятие предложения:', offerId, data);
        try {
            const response = await axiosInstance.post(`/trades/offers/${offerId}/accept/`, data);
            console.log('TradeService: Предложение принято:', response.data);
            return response.data;
        } catch (error) {
            console.error('TradeService: Ошибка принятия предложения:', error);
            throw error;
        }
    },

    // Отклонение предложения
    rejectOffer: async (offerId: number, data: TradeActionData = {}): Promise<{ success: boolean; message: string }> => {
        console.log('TradeService: Отклонение предложения:', offerId, data);
        try {
            const response = await axiosInstance.post(`/trades/offers/${offerId}/reject/`, data);
            console.log('TradeService: Предложение отклонено:', response.data);
            return response.data;
        } catch (error) {
            console.error('TradeService: Ошибка отклонения предложения:', error);
            throw error;
        }
    },

    // Отмена предложения
    cancelOffer: async (offerId: number, data: TradeActionData = {}): Promise<{ success: boolean; message: string }> => {
        console.log('TradeService: Отмена предложения:', offerId, data);
        try {
            const response = await axiosInstance.post(`/trades/offers/${offerId}/cancel/`, data);
            console.log('TradeService: Предложение отменено:', response.data);
            return response.data;
        } catch (error) {
            console.error('TradeService: Ошибка отмены предложения:', error);
            throw error;
        }
    },

    // Завершение обмена
    completeOffer: async (offerId: number, data: TradeActionData = {}): Promise<{ success: boolean; message: string }> => {
        console.log('TradeService: Завершение обмена:', offerId, data);
        try {
            const response = await axiosInstance.post(`/trades/offers/${offerId}/complete/`, data);
            console.log('TradeService: Обмен завершен:', response.data);
            return response.data;
        } catch (error) {
            console.error('TradeService: Ошибка завершения обмена:', error);
            throw error;
        }
    },

    // Получение адресов участников обмена
    getParticipantLocations: async (receiverId: number): Promise<ParticipantLocations> => {
        console.log('TradeService: Получение адресов участников обмена для получателя:', receiverId);
        try {
            const response = await axiosInstance.get(`/profiles/locations/participant_locations/?receiver_id=${receiverId}`);
            console.log('TradeService: Адреса участников получены:', response.data);
            return response.data;
        } catch (error) {
            console.error('TradeService: Ошибка получения адресов участников:', error);
            throw error;
        }
    }
}; 