import { axiosInstance } from './axiosInstance';
import { Chat, Message, CreateChatData, CreateMessageData } from '../types/chat';

export const chatService = {
    // Получение списка чатов
    getChats: async (): Promise<{ results: Chat[] }> => {
        console.log('ChatService: Получение списка чатов');
        try {
            const response = await axiosInstance.get('/messaging/chats/');
            console.log('ChatService: Чаты получены:', response.data);
            return response.data;
        } catch (error) {
            console.error('ChatService: Ошибка получения чатов:', error);
            throw error;
        }
    },

    // Создание чата
    createChat: async (data: CreateChatData): Promise<Chat> => {
        console.log('ChatService: Создание чата:', data);
        try {
            const response = await axiosInstance.post('/messaging/chats/', data);
            console.log('ChatService: Чат создан:', response.data);
            return response.data;
        } catch (error) {
            console.error('ChatService: Ошибка создания чата:', error);
            throw error;
        }
    },

    // Получение чата по ID сделки
    getChatByTrade: async (tradeOfferId: number): Promise<Chat> => {
        console.log('ChatService: Получение чата для сделки:', tradeOfferId);
        try {
            const response = await axiosInstance.get(`/messaging/chats/by_trade/?trade_offer_id=${tradeOfferId}`);
            console.log('ChatService: Чат сделки получен:', response.data);
            return response.data;
        } catch (error) {
            console.error('ChatService: Ошибка получения чата сделки:', error);
            throw error;
        }
    },

    // Получение чата с пользователем
    getChatByUser: async (userId: number): Promise<Chat> => {
        console.log('ChatService: Получение чата с пользователем:', userId);
        try {
            const response = await axiosInstance.get(`/messaging/chats/by_user/?user_id=${userId}`);
            console.log('ChatService: Чат с пользователем получен:', response.data);
            return response.data;
        } catch (error) {
            console.error('ChatService: Ошибка получения чата с пользователем:', error);
            throw error;
        }
    },

    // Получение сообщений чата
    getMessages: async (chatId: number, page: number = 1): Promise<{ results: Message[], count: number, next: string | null, previous: string | null }> => {
        console.log('ChatService: Получение сообщений чата:', chatId, 'страница:', page);
        try {
            const response = await axiosInstance.get(`/messaging/messages/?chat_id=${chatId}&page=${page}`);
            console.log('ChatService: Сообщения получены:', response.data);
            return response.data;
        } catch (error) {
            console.error('ChatService: Ошибка получения сообщений:', error);
            throw error;
        }
    },

    // Отправка сообщения
    sendMessage: async (data: CreateMessageData): Promise<Message> => {
        console.log('ChatService: Отправка сообщения:', data);
        try {
            const response = await axiosInstance.post('/messaging/messages/', data);
            console.log('ChatService: Сообщение отправлено:', response.data);
            return response.data;
        } catch (error) {
            console.error('ChatService: Ошибка отправки сообщения:', error);
            throw error;
        }
    },

    // Отметить все сообщения как прочитанные
    markChatAsRead: async (chatId: number): Promise<{ status: string }> => {
        console.log('ChatService: Отметка чата как прочитанного:', chatId);
        try {
            const response = await axiosInstance.post(`/messaging/chats/${chatId}/mark_as_read/`);
            console.log('ChatService: Чат отмечен как прочитанный:', response.data);
            return response.data;
        } catch (error) {
            console.error('ChatService: Ошибка отметки чата как прочитанного:', error);
            throw error;
        }
    },

    // Включить/выключить уведомления
    toggleMute: async (chatId: number): Promise<{ is_muted: boolean }> => {
        console.log('ChatService: Переключение уведомлений чата:', chatId);
        try {
            const response = await axiosInstance.post(`/messaging/chats/${chatId}/toggle_mute/`);
            console.log('ChatService: Уведомления переключены:', response.data);
            return response.data;
        } catch (error) {
            console.error('ChatService: Ошибка переключения уведомлений:', error);
            throw error;
        }
    }
}; 