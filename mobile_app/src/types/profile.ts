export interface UserProfile {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar?: string;
    avatar_url?: string;
    bio?: string;
    phone_number?: string;
    rating?: string;
    total_reviews?: number;
    successful_trades?: number;
    created_at?: string;
    updated_at?: string;
}

export interface UserLocation {
    id: number;
    title: string;
    address: string;
    city: string;
    region: string;
    postal_code: string;
    country: string;
    latitude: number;
    longitude: number;
    is_primary: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface UserPreferences {
    id: number;
    max_distance: number;
    notification_enabled: boolean;
    email_notifications: boolean;
    push_notifications: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface UpdateProfileData {
    bio?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
}

export interface UpdateAvatarData {
    avatar: any; // Файл изображения
}

export interface CreateLocationData {
    title: string;
    address: string;
    city: string;
    region: string;
    postal_code: string;
    country: string;
    latitude: number;
    longitude: number;
    is_primary: boolean;
}

export interface UpdateLocationData {
    title?: string;
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    is_primary?: boolean;
}

export interface UpdatePreferencesData {
    max_distance?: number;
    notification_enabled?: boolean;
    email_notifications?: boolean;
    push_notifications?: boolean;
}

export interface ProfileState {
    profile: UserProfile | null;
    publicProfile: UserProfile | null;
    locations: UserLocation[];
    preferences: UserPreferences | null;
    primaryLocation: UserLocation | null;
    loading: boolean;
    error: string | null;
} 