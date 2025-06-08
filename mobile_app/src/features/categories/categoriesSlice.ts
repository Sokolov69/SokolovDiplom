import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
    Category, 
    CategoryState, 
    CategoryTreeItem,
    CategoryFilter 
} from '../../types/category';
import { 
    fetchCategories, 
    fetchCategoryById, 
    fetchCategoryChildren,
    fetchCategoryTree, 
    createCategory, 
    updateCategory,
    deleteCategory
} from './categoriesThunks';

const initialState: CategoryState = {
    items: [],
    currentCategory: null,
    childCategories: [],
    tree: [],
    loading: false,
    error: null,
};

const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        setCategories: (state, action: PayloadAction<Category[]>) => {
            console.log('[categoriesSlice] setCategories вызван с количеством категорий:', action.payload.length);
            state.items = action.payload;
            state.error = null;
        },
        setCurrentCategory: (state, action: PayloadAction<Category | null>) => {
            console.log('[categoriesSlice] setCurrentCategory вызван с категорией:', action.payload);
            state.currentCategory = action.payload;
            state.error = null;
        },
        setChildCategories: (state, action: PayloadAction<Category[]>) => {
            console.log('[categoriesSlice] setChildCategories вызван с количеством категорий:', action.payload.length);
            state.childCategories = action.payload;
            state.error = null;
        },
        setCategoryTree: (state, action: PayloadAction<CategoryTreeItem[]>) => {
            console.log('[categoriesSlice] setCategoryTree вызван с количеством корневых категорий:', action.payload.length);
            state.tree = action.payload;
            state.error = null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            console.log('[categoriesSlice] setLoading вызван со значением:', action.payload);
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            console.log('[categoriesSlice] setError вызван с ошибкой:', action.payload);
            state.error = action.payload;
        },
        clearCategories: (state) => {
            console.log('[categoriesSlice] clearCategories вызван');
            state.items = [];
            state.currentCategory = null;
            state.childCategories = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Обработка получения списка категорий
            .addCase(fetchCategories.pending, (state) => {
                console.log('[categoriesSlice] fetchCategories.pending');
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                console.log('[categoriesSlice] fetchCategories.fulfilled с данными:', action.payload);
                
                // Проверка типа данных и преобразование при необходимости
                const categories = action.payload || [];
                
                if (!Array.isArray(categories)) {
                    console.error('[categoriesSlice] fetchCategories.fulfilled: payload не является массивом');
                    state.items = [];
                } else {
                    console.log('[categoriesSlice] fetchCategories.fulfilled с количеством категорий:', categories.length);
                    state.items = categories;
                }
                
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                console.error('[categoriesSlice] fetchCategories.rejected с ошибкой:', action.payload);
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения категории по ID
            .addCase(fetchCategoryById.pending, (state) => {
                console.log('[categoriesSlice] fetchCategoryById.pending');
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategoryById.fulfilled, (state, action) => {
                console.log('[categoriesSlice] fetchCategoryById.fulfilled с категорией:', action.payload);
                state.loading = false;
                state.currentCategory = action.payload;
                state.error = null;
            })
            .addCase(fetchCategoryById.rejected, (state, action) => {
                console.error('[categoriesSlice] fetchCategoryById.rejected с ошибкой:', action.payload);
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения дочерних категорий
            .addCase(fetchCategoryChildren.pending, (state) => {
                console.log('[categoriesSlice] fetchCategoryChildren.pending');
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategoryChildren.fulfilled, (state, action) => {
                console.log('[categoriesSlice] fetchCategoryChildren.fulfilled с количеством категорий:', action.payload.length);
                state.loading = false;
                state.childCategories = action.payload;
                state.error = null;
            })
            .addCase(fetchCategoryChildren.rejected, (state, action) => {
                console.error('[categoriesSlice] fetchCategoryChildren.rejected с ошибкой:', action.payload);
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения дерева категорий
            .addCase(fetchCategoryTree.pending, (state) => {
                console.log('[categoriesSlice] fetchCategoryTree.pending');
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategoryTree.fulfilled, (state, action) => {
                console.log('[categoriesSlice] fetchCategoryTree.fulfilled с количеством корневых категорий:', action.payload.length);
                state.loading = false;
                state.tree = action.payload;
                state.error = null;
            })
            .addCase(fetchCategoryTree.rejected, (state, action) => {
                console.error('[categoriesSlice] fetchCategoryTree.rejected с ошибкой:', action.payload);
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка создания категории
            .addCase(createCategory.pending, (state) => {
                console.log('[categoriesSlice] createCategory.pending');
                state.loading = true;
                state.error = null;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                console.log('[categoriesSlice] createCategory.fulfilled с новой категорией:', action.payload);
                state.loading = false;
                state.items = [...state.items, action.payload];
                state.error = null;
            })
            .addCase(createCategory.rejected, (state, action) => {
                console.error('[categoriesSlice] createCategory.rejected с ошибкой:', action.payload);
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка обновления категории
            .addCase(updateCategory.pending, (state) => {
                console.log('[categoriesSlice] updateCategory.pending');
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                console.log('[categoriesSlice] updateCategory.fulfilled с обновленной категорией:', action.payload);
                state.loading = false;
                const updatedCategory = action.payload;
                state.items = state.items.map(item => 
                    item.id === updatedCategory.id ? updatedCategory : item
                );
                if (state.currentCategory?.id === updatedCategory.id) {
                    console.log('[categoriesSlice] updateCategory.fulfilled обновление currentCategory');
                    state.currentCategory = updatedCategory;
                }
                state.error = null;
            })
            .addCase(updateCategory.rejected, (state, action) => {
                console.error('[categoriesSlice] updateCategory.rejected с ошибкой:', action.payload);
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка удаления категории
            .addCase(deleteCategory.pending, (state) => {
                console.log('[categoriesSlice] deleteCategory.pending');
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                const deletedId = action.meta.arg;
                console.log('[categoriesSlice] deleteCategory.fulfilled для ID:', deletedId);
                state.loading = false;
                state.items = state.items.filter(item => item.id !== deletedId);
                if (state.currentCategory?.id === deletedId) {
                    console.log('[categoriesSlice] deleteCategory.fulfilled сброс currentCategory');
                    state.currentCategory = null;
                }
                state.error = null;
            })
            .addCase(deleteCategory.rejected, (state, action) => {
                console.error('[categoriesSlice] deleteCategory.rejected с ошибкой:', action.payload);
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { 
    setCategories, 
    setCurrentCategory, 
    setChildCategories,
    setCategoryTree,
    setLoading, 
    setError, 
    clearCategories 
} = categoriesSlice.actions;

export default categoriesSlice.reducer; 