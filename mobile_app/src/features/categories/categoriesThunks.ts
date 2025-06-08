import { createAsyncThunk } from '@reduxjs/toolkit';
import { categoryAPI } from '../../services/categoryService';
import { 
    Category, 
    CategoryFilter, 
    CategoryTreeItem,
    CreateCategoryData,
    UpdateCategoryData
} from '../../types/category';

// Получение списка категорий
export const fetchCategories = createAsyncThunk<Category[], CategoryFilter | undefined>(
    'categories/fetchCategories',
    async (filter, { rejectWithValue }) => {
        // Получаем стек вызовов для трассировки источника запроса
        const stackTrace = new Error().stack;
        console.log('[categoriesThunks] fetchCategories начало выполнения с фильтром:', filter);
        console.log('[categoriesThunks] Стек вызова:', stackTrace);
        
        try {
            const result = await categoryAPI.getCategories(filter);
            
            // Проверка типа данных и преобразование при необходимости
            if (!result) {
                console.error('[categoriesThunks] fetchCategories: результат пуст или undefined');
                return [];
            }
            
            // Убедимся, что результат - массив
            const categories = Array.isArray(result) ? result : [];
            
            console.log('[categoriesThunks] fetchCategories успешно получено категорий:', categories.length);
            console.log('[categoriesThunks] fetchCategories первые категории:', categories.slice(0, 3));
            
            return categories;
        } catch (error: any) {
            console.error('[categoriesThunks] fetchCategories ошибка:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить категории';
            console.error('[categoriesThunks] fetchCategories сообщение об ошибке:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение категории по ID
export const fetchCategoryById = createAsyncThunk<Category, number>(
    'categories/fetchCategoryById',
    async (id, { rejectWithValue }) => {
        console.log('[categoriesThunks] fetchCategoryById начало выполнения с ID:', id);
        try {
            const result = await categoryAPI.getCategoryById(id);
            console.log('[categoriesThunks] fetchCategoryById успешно получена категория:', result);
            return result;
        } catch (error: any) {
            console.error('[categoriesThunks] fetchCategoryById ошибка:', error);
            const errorMessage = error.response?.data?.detail || `Не удалось загрузить категорию с ID ${id}`;
            console.error('[categoriesThunks] fetchCategoryById сообщение об ошибке:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение дочерних категорий
export const fetchCategoryChildren = createAsyncThunk<Category[], number>(
    'categories/fetchCategoryChildren',
    async (parentId, { rejectWithValue }) => {
        console.log('[categoriesThunks] fetchCategoryChildren начало выполнения для родителя ID:', parentId);
        try {
            const result = await categoryAPI.getCategoryChildren(parentId);
            console.log('[categoriesThunks] fetchCategoryChildren успешно получено дочерних категорий:', result.length);
            return result;
        } catch (error: any) {
            console.error('[categoriesThunks] fetchCategoryChildren ошибка:', error);
            const errorMessage = error.response?.data?.detail || `Не удалось загрузить дочерние категории для ID ${parentId}`;
            console.error('[categoriesThunks] fetchCategoryChildren сообщение об ошибке:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение дерева категорий
export const fetchCategoryTree = createAsyncThunk<CategoryTreeItem[]>(
    'categories/fetchCategoryTree',
    async (_, { rejectWithValue }) => {
        console.log('[categoriesThunks] fetchCategoryTree начало выполнения');
        try {
            const result = await categoryAPI.getCategoryTree();
            console.log('[categoriesThunks] fetchCategoryTree успешно получено дерево категорий');
            return result;
        } catch (error: any) {
            console.error('[categoriesThunks] fetchCategoryTree ошибка:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить дерево категорий';
            console.error('[categoriesThunks] fetchCategoryTree сообщение об ошибке:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

// Создание новой категории
export const createCategory = createAsyncThunk<Category, CreateCategoryData>(
    'categories/createCategory',
    async (data, { rejectWithValue }) => {
        console.log('[categoriesThunks] createCategory начало выполнения с данными:', JSON.stringify(data, null, 2));
        try {
            const result = await categoryAPI.createCategory(data);
            console.log('[categoriesThunks] createCategory успешно создана категория:', result);
            return result;
        } catch (error: any) {
            console.error('[categoriesThunks] createCategory ошибка:', error);
            let errorMessage = 'Не удалось создать категорию';
            
            if (error.response?.data) {
                console.error('[categoriesThunks] createCategory данные ошибки:', error.response.data);
                
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                } else {
                    // Обработка ошибок валидации полей
                    const fieldErrors = Object.entries(error.response.data)
                        .map(([field, messages]: [string, any]) => {
                            if (Array.isArray(messages)) {
                                return `${field}: ${messages.join(', ')}`;
                            }
                            return `${field}: ${messages}`;
                        })
                        .join('; ');
                    
                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                    }
                }
            }
            
            console.error('[categoriesThunks] createCategory финальное сообщение об ошибке:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

// Обновление категории
export const updateCategory = createAsyncThunk<Category, UpdateCategoryData>(
    'categories/updateCategory',
    async (data, { rejectWithValue }) => {
        console.log('[categoriesThunks] updateCategory начало выполнения с ID:', data.id);
        console.log('[categoriesThunks] updateCategory данные для обновления:', JSON.stringify(data, null, 2));
        try {
            const result = await categoryAPI.updateCategory(data);
            console.log('[categoriesThunks] updateCategory успешно обновлена категория:', result);
            return result;
        } catch (error: any) {
            console.error('[categoriesThunks] updateCategory ошибка:', error);
            let errorMessage = `Не удалось обновить категорию с ID ${data.id}`;
            
            if (error.response?.data) {
                console.error('[categoriesThunks] updateCategory данные ошибки:', error.response.data);
                
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                } else {
                    // Обработка ошибок валидации полей
                    const fieldErrors = Object.entries(error.response.data)
                        .map(([field, messages]: [string, any]) => {
                            if (Array.isArray(messages)) {
                                return `${field}: ${messages.join(', ')}`;
                            }
                            return `${field}: ${messages}`;
                        })
                        .join('; ');
                    
                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                    }
                }
            }
            
            console.error('[categoriesThunks] updateCategory финальное сообщение об ошибке:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

// Удаление категории
export const deleteCategory = createAsyncThunk<void, number>(
    'categories/deleteCategory',
    async (id, { rejectWithValue }) => {
        console.log('[categoriesThunks] deleteCategory начало выполнения с ID:', id);
        try {
            await categoryAPI.deleteCategory(id);
            console.log('[categoriesThunks] deleteCategory успешно удалена категория с ID:', id);
        } catch (error: any) {
            console.error('[categoriesThunks] deleteCategory ошибка:', error);
            const errorMessage = error.response?.data?.detail || `Не удалось удалить категорию с ID ${id}`;
            console.error('[categoriesThunks] deleteCategory сообщение об ошибке:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
); 