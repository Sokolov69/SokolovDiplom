import { User } from './auth';
import { CategoryShort } from './category';
import { UserLocation } from './profile';

export interface ItemCondition {
    id: number;
    name: string;
    description: string;
    order: number;
}

export interface ItemStatus {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    order: number;
}

export interface ItemTag {
    id: number;
    name: string;
    slug: string;
}

export interface ItemImage {
    id: number;
    image: string;
    image_url: string;
    is_primary: boolean;
    order: number;
    created_at: string;
}

export interface ItemShort {
    id: number;
    title: string;
    slug: string;
    description: string;
    owner: number;
    owner_details: User;
    category: number;
    category_details: CategoryShort;
    condition: number;
    condition_name: string;
    status: number;
    status_name: string;
    location: number | null;
    location_details: UserLocation | null;
    primary_image: string | null;
    tags: ItemTag[];
    created_at: string;
    updated_at: string;
    estimated_value?: string | null;
    is_favorited?: boolean | null;
}

export interface Item extends Omit<ItemShort, 'is_favorited' | 'estimated_value'> {
    condition_details: ItemCondition;
    status_details: ItemStatus;
    estimated_value: string;
    views_count: number;
    favorites_count: number;
    is_featured: boolean;
    images: ItemImage[];
    is_favorited: boolean | null;
}

export interface ItemFilter {
    category?: number;
    condition?: number;
    status?: number;
    search?: string;
    ordering?: string;
    page?: number;
    owner?: number;
}

export interface ItemPaginatedResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ItemShort[];
}

export interface CreateItemData {
    title: string;
    description: string;
    category: number;
    condition: number;
    status: number;
    location?: number | null;
    estimated_value?: number | null;
    tags?: string[];
}

export interface UpdateItemData extends Partial<CreateItemData> {
    id: number;
}

export interface ItemState {
    items: ItemShort[];
    myItems: ItemShort[];
    userItems: ItemShort[];
    favorites: ItemShort[];
    currentItem: Item | null;
    conditions: ItemCondition[];
    statuses: ItemStatus[];
    tags: ItemTag[];
    userLocations: UserLocation[];
    pagination: {
        total: number;
        nextPage: string | null;
        prevPage: string | null;
    };
    loading: boolean;
    error: string | null;
} 