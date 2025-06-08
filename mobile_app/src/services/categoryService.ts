import { axiosInstance } from './axiosInstance';
import { 
    Category, 
    CategoryShort, 
    CategoryFilter, 
    CategoryTreeItem,
    CreateCategoryData,
    UpdateCategoryData 
} from '../types/category';

export const categoryAPI = {
    getCategories: async (filter?: CategoryFilter): Promise<Category[]> => {
        try {
            const params = new URLSearchParams();
            
            if (filter) {
                if (filter.parent !== undefined) {
                    if (filter.parent === null) {
                        params.append('parent', '');
                    } else {
                        params.append('parent', filter.parent.toString());
                    }
                }
                if (filter.level !== undefined) {
                    params.append('level', filter.level.toString());
                }
                if (filter.is_active !== undefined) {
                    params.append('is_active', filter.is_active.toString());
                }
                if (filter.search) {
                    params.append('search', filter.search);
                }
                if (filter.ordering) {
                    params.append('ordering', filter.ordering);
                }
            }

            const queryString = params.toString() ? `?${params.toString()}` : '';
            const fullUrl = `/categories/${queryString}`;

            console.log('[categoryAPI] Запрос категорий:', fullUrl);
            console.log('[categoryAPI] Фильтр:', JSON.stringify(filter, null, 2));
            
            const response = await axiosInstance.get(fullUrl);
            
            if (!response.data) {
                console.warn('[categoryAPI] Пустой ответ от сервера');
                return [];
            }
            
            if (response.data.results && Array.isArray(response.data.results)) {
                console.log('[categoryAPI] Получен пагинированный ответ, категорий:', response.data.results.length);
                console.log('[categoryAPI] Первые категории:', response.data.results.slice(0, 3).map((c: Category) => ({ id: c.id, name: c.name, parent: c.parent })));
                return response.data.results;
            }
            
            if (Array.isArray(response.data)) {
                console.log('[categoryAPI] Получен массив категорий:', response.data.length);
                console.log('[categoryAPI] Первые категории:', response.data.slice(0, 3).map((c: Category) => ({ id: c.id, name: c.name, parent: c.parent })));
                return response.data;
            }
            
            console.warn('[categoryAPI] Неожиданный формат ответа:', typeof response.data);
            return [];
        } catch (error: any) {
            console.error('[categoryAPI] Ошибка при получении категорий:', error);
            if (error.response) {
                console.error('[categoryAPI] Статус ошибки:', error.response.status);
                console.error('[categoryAPI] Данные ошибки:', error.response.data);
            }
            throw error;
        }
    },

    getCategoryById: async (id: number): Promise<Category> => {
        try {
            console.log('[categoryAPI] Запрос категории по ID:', id);
            const response = await axiosInstance.get(`/categories/${id}/`);
            console.log('[categoryAPI] Категория получена:', response.data.name);
            return response.data;
        } catch (error) {
            console.error(`[categoryAPI] Ошибка при получении категории с ID ${id}:`, error);
            throw error;
        }
    },

    getCategoryChildren: async (id: number): Promise<Category[]> => {
        try {
            console.log('[categoryAPI] Запрос дочерних категорий для ID:', id);
            const response = await axiosInstance.get(`/categories/${id}/children/`);
            console.log('[categoryAPI] Дочерние категории получены:', response.data.length);
            return response.data;
        } catch (error) {
            console.error(`[categoryAPI] Ошибка при получении дочерних категорий для ID ${id}:`, error);
            throw error;
        }
    },

    getCategoryTree: async (): Promise<CategoryTreeItem[]> => {
        try {
            console.log('[categoryAPI] Запрос дерева категорий');
            const response = await axiosInstance.get('/categories/tree/');
            console.log('[categoryAPI] Дерево категорий получено');
            return response.data;
        } catch (error) {
            console.error('[categoryAPI] Ошибка при получении дерева категорий:', error);
            throw error;
        }
    },

    createCategory: async (data: CreateCategoryData): Promise<Category> => {
        try {
            console.log('[categoryAPI] Создание категории:', data.name);
            
            const formData = new FormData();
            
            formData.append('name', data.name);
            
            if (data.slug) {
                formData.append('slug', data.slug);
            }

            if (data.description) {
                formData.append('description', data.description);
            }
            
            if (data.parent !== undefined) {
                if (data.parent === null) {
                    formData.append('parent', '');
                } else {
                    formData.append('parent', data.parent.toString());
                }
            }
            
            if (data.icon) {
                formData.append('icon', data.icon);
            }
            
            if (data.is_active !== undefined) {
                formData.append('is_active', data.is_active.toString());
            }
            
            if (data.order !== undefined) {
                formData.append('order', data.order.toString());
            }

            const response = await axiosInstance.post('/categories/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            console.log('[categoryAPI] Категория создана успешно:', response.data.name);
            return response.data;
        } catch (error: any) {
            console.error('[categoryAPI] Ошибка при создании категории:', error);
            
            if (error.response) {
                console.error('[categoryAPI] Статус ошибки:', error.response.status);
                console.error('[categoryAPI] Данные ошибки:', error.response.data);
            }
            
            throw error;
        }
    },

    updateCategory: async (data: UpdateCategoryData): Promise<Category> => {
        try {
            console.log('[categoryAPI] Обновление категории ID:', data.id);
            
            const { id, ...updateData } = data;
            
            const formData = new FormData();
            
            if (updateData.name) {
                formData.append('name', updateData.name);
            }
            
            if (updateData.slug) {
                formData.append('slug', updateData.slug);
            }
            
            if (updateData.description !== undefined) {
                formData.append('description', updateData.description || '');
            }
            
            if (updateData.parent !== undefined) {
                if (updateData.parent === null) {
                    formData.append('parent', '');
                } else {
                    formData.append('parent', updateData.parent.toString());
                }
            }
            
            if (updateData.icon) {
                formData.append('icon', updateData.icon);
            }
            
            if (updateData.is_active !== undefined) {
                formData.append('is_active', updateData.is_active.toString());
            }
            
            if (updateData.order !== undefined) {
                formData.append('order', updateData.order.toString());
            }

            const response = await axiosInstance.put(`/categories/${id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            console.log('[categoryAPI] Категория обновлена успешно:', response.data.name);
            return response.data;
        } catch (error: any) {
            console.error(`[categoryAPI] Ошибка при обновлении категории с ID ${data.id}:`, error);
            
            if (error.response) {
                console.error('[categoryAPI] Статус ошибки:', error.response.status);
                console.error('[categoryAPI] Данные ошибки:', error.response.data);
            }
            
            throw error;
        }
    },

    deleteCategory: async (id: number): Promise<void> => {
        try {
            console.log(`[categoryAPI] Удаление категории с ID ${id}`);
            await axiosInstance.delete(`/categories/${id}/`);
            console.log(`[categoryAPI] Категория с ID ${id} успешно удалена`);
        } catch (error: any) {
            console.error(`[categoryAPI] Ошибка при удалении категории с ID ${id}:`, error);
            
            if (error.response) {
                console.error('[categoryAPI] Статус ошибки:', error.response.status);
                console.error('[categoryAPI] Данные ошибки:', error.response.data);
            }
            
            throw error;
        }
    }
}; 