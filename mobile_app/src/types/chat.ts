import { User } from './auth';

export interface Chat {
    id: number;
    participants: number[];
    participants_details: User[];
    trade_offer?: number;
    is_active: boolean;
    last_message_time: string | null;
    last_message: Message | null;
    unread_count: number;
    is_muted: boolean;
    created_at: string;
}

export interface Message {
    id: number;
    chat: number;
    sender: number;
    sender_details: User;
    content: string;
    is_read: boolean;
    read_at: string | null;
    attachments: MessageAttachment[];
    created_at: string;
    updated_at: string;
}

export interface MessageAttachment {
    id: number;
    file: string;
    file_name: string;
    file_size: number;
    file_type: string;
    created_at: string;
}

export interface CreateChatData {
    participants: number[];
    trade_offer?: number;
}

export interface CreateMessageData {
    chat: number;
    content: string;
    attachments?: File[];
}

export interface ChatState {
    chats: Chat[];
    currentChat: Chat | null;
    messages: Message[];
    loading: boolean;
    messagesLoading: boolean;
    error: string | null;
    pagination: {
        total: number;
        nextPage: string | null;
        prevPage: string | null;
    };
} 