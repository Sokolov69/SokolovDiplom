export interface CategoryShort {
    id: number;
    name: string;
    slug: string;
    icon?: string | null;
}

export interface Category extends CategoryShort {
    description?: string;
    parent: number | null;
    parent_details?: CategoryShort | null;
    is_active: boolean;
    level: number;
    order?: number;
    children?: CategoryShort[];
    created_at?: string;
    updated_at?: string;
}

export interface CategoryFilter {
    parent?: number | null;
    level?: number;
    is_active?: boolean;
    search?: string;
    ordering?: string;
}

export interface CategoryTreeItem extends Category {
    children: CategoryTreeItem[];
}

export interface CategoryState {
    items: Category[];
    currentCategory: Category | null;
    childCategories: Category[];
    tree: CategoryTreeItem[];
    loading: boolean;
    error: string | null;
}

export interface CreateCategoryData {
    name: string;
    slug?: string;
    description?: string;
    parent?: number | null;
    icon?: any; // Может быть строкой URL или объектом File для загрузки
    is_active?: boolean;
    order?: number;
}

export interface UpdateCategoryData extends CreateCategoryData {
    id: number;
} 