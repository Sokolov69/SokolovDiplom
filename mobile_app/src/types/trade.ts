import { User } from './auth';
import { ItemShort } from './item';
import { UserLocation } from './profile';

export interface TradeStatus {
    id: number;
    name: string;
    description: string;
}

export interface TradeOffer {
    id: number;
    initiator: User;
    receiver: User;
    status: TradeStatus;
    location?: number;
    location_details?: UserLocation;
    message?: string;
    created_at: string;
    initiator_items: ItemShort[];
    receiver_items: ItemShort[];
}

export interface CreateTradeOfferData {
    receiver_id: number;
    location?: number;
    message?: string;
    initiator_items: number[];
    receiver_items: number[];
}

export interface ParticipantLocations {
    initiator_locations: UserLocation[];
    receiver_locations: UserLocation[];
}

export interface TradeActionData {
    comment?: string;
}

export interface TradeOfferFilter {
    type?: 'sent' | 'received';
    page?: number;
}

export interface TradeOfferPaginatedResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: TradeOffer[];
}

export interface TradeState {
    offers: TradeOffer[];
    currentOffer: TradeOffer | null;
    statuses: TradeStatus[];
    pagination: {
        total: number;
        nextPage: string | null;
        prevPage: string | null;
    };
    loading: boolean;
    error: string | null;
    actionLoading: boolean; // для действий accept/reject/cancel/complete
} 