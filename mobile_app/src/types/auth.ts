export interface Role {
    id: number;
    name: string;
    description: string;
    is_staff_role: boolean;
    is_moderator_role: boolean;
    is_superuser_role: boolean;
    priority: number;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar_url?: string;
    rating?: number | string;
    total_reviews?: number;
    successful_trades?: number;
    roles?: Role[];
    highest_role?: Role;
    is_banned?: boolean;
    ban_expiry?: string | null;
    last_activity?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    error: string | null;
    validationErrors: Record<string, string[]> | null;
    loading: boolean;
}

export interface TokenResponse {
    access: string;
    refresh: string;
}

export interface LoginData extends Record<string, string> {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
}

export interface UpdateUserData {
    first_name?: string;
    last_name?: string;
    email?: string;
}

export interface ChangePasswordData {
    old_password: string;
    new_password: string;
    new_password2: string;
} 