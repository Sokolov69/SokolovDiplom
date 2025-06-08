import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
    ItemState, 
    ItemShort, 
    Item, 
    ItemCondition, 
    ItemStatus, 
    ItemTag, 
    ItemImage 
} from '../../types/item';
import { UserLocation } from '../../types/profile';
import { 
    fetchItems, 
    fetchItemById, 
    fetchMyItems, 
    fetchUserItems,
    fetchFavorites,
    fetchItemConditions, 
    fetchItemStatuses, 
    fetchItemTags,
    fetchUserLocations,
    createItem, 
    updateItem,
    softDeleteItem,
    toggleFavorite,
    uploadItemImage,
    deleteItemImage,
    setPrimaryImage,
    createTag,
    createItemWithImages,
    updateItemWithImages
} from './itemsThunks';

const initialState: ItemState = {
    items: [],
    myItems: [],
    userItems: [],
    favorites: [],
    currentItem: null,
    conditions: [],
    statuses: [],
    tags: [],
    userLocations: [],
    pagination: {
        total: 0,
        nextPage: null,
        prevPage: null
    },
    loading: false,
    error: null,
};

const itemsSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {
        setItems: (state, action: PayloadAction<ItemShort[]>) => {
            state.items = action.payload;
            state.error = null;
        },
        setMyItems: (state, action: PayloadAction<ItemShort[]>) => {
            state.myItems = action.payload;
            state.error = null;
        },
        setUserItems: (state, action: PayloadAction<ItemShort[]>) => {
            state.userItems = action.payload;
            state.error = null;
        },
        setFavorites: (state, action: PayloadAction<ItemShort[]>) => {
            state.favorites = action.payload;
            state.error = null;
        },
        setCurrentItem: (state, action: PayloadAction<Item | null>) => {
            state.currentItem = action.payload;
            state.error = null;
        },
        setConditions: (state, action: PayloadAction<ItemCondition[]>) => {
            state.conditions = action.payload;
            state.error = null;
        },
        setStatuses: (state, action: PayloadAction<ItemStatus[]>) => {
            state.statuses = action.payload;
            state.error = null;
        },
        setTags: (state, action: PayloadAction<ItemTag[]>) => {
            state.tags = action.payload;
            state.error = null;
        },
        setUserLocations: (state, action: PayloadAction<UserLocation[]>) => {
            state.userLocations = action.payload;
            state.error = null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearItems: (state) => {
            state.items = [];
            state.myItems = [];
            state.userItems = [];
            state.favorites = [];
            state.currentItem = null;
            state.error = null;
        },
        clearItemsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Обработка получения списка предметов
            .addCase(fetchItems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchItems.fulfilled, (state, action) => {
                state.loading = false;
                console.log(`[itemsSlice]`)
                if (action.payload.results && action.payload.results.length > 0) {
                    console.log('Первый предмет tags в slice:', action.payload.results[0].tags);
                }
                state.items = action.payload.results;
                state.pagination = {
                    total: action.payload.count,
                    nextPage: action.payload.next,
                    prevPage: action.payload.previous
                };
                state.error = null;
            })
            .addCase(fetchItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения деталей предмета
            .addCase(fetchItemById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchItemById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentItem = action.payload;
                state.error = null;
            })
            .addCase(fetchItemById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения предметов текущего пользователя
            .addCase(fetchMyItems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyItems.fulfilled, (state, action) => {
                state.loading = false;
                state.myItems = action.payload.results;
                state.error = null;
            })
            .addCase(fetchMyItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения предметов пользователя
            .addCase(fetchUserItems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserItems.fulfilled, (state, action) => {
                state.loading = false;
                state.userItems = action.payload.results;
                state.error = null;
            })
            .addCase(fetchUserItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения избранных предметов
            .addCase(fetchFavorites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFavorites.fulfilled, (state, action) => {
                state.loading = false;
                state.favorites = action.payload.results;
                state.error = null;
            })
            .addCase(fetchFavorites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения условий предметов
            .addCase(fetchItemConditions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchItemConditions.fulfilled, (state, action) => {
                state.loading = false;
                state.conditions = action.payload;
                state.error = null;
            })
            .addCase(fetchItemConditions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения статусов предметов
            .addCase(fetchItemStatuses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchItemStatuses.fulfilled, (state, action) => {
                state.loading = false;
                state.statuses = action.payload;
                state.error = null;
            })
            .addCase(fetchItemStatuses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения тегов
            .addCase(fetchItemTags.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchItemTags.fulfilled, (state, action) => {
                state.loading = false;
                state.tags = action.payload;
                state.error = null;
            })
            .addCase(fetchItemTags.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка создания нового тега
            .addCase(createTag.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTag.fulfilled, (state, action) => {
                state.loading = false;
                // Добавляем новый тег в список существующих тегов
                state.tags = [...state.tags, action.payload];
                state.error = null;
            })
            .addCase(createTag.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка получения адресов пользователя
            .addCase(fetchUserLocations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserLocations.fulfilled, (state, action) => {
                state.loading = false;
                state.userLocations = action.payload;
                state.error = null;
            })
            .addCase(fetchUserLocations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка создания предмета
            .addCase(createItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createItem.fulfilled, (state, action) => {
                state.loading = false;
                state.items = [...state.items, action.payload];
                state.myItems = [...state.myItems, action.payload];
                state.currentItem = action.payload;
                state.error = null;
            })
            .addCase(createItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка создания предмета с изображениями
            .addCase(createItemWithImages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createItemWithImages.fulfilled, (state, action) => {
                state.loading = false;
                state.items = [...state.items, action.payload];
                state.myItems = [...state.myItems, action.payload];
                state.currentItem = action.payload;
                state.error = null;
            })
            .addCase(createItemWithImages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка обновления предмета
            .addCase(updateItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateItem.fulfilled, (state, action) => {
                state.loading = false;
                const updatedItem = action.payload;
                
                // Обновляем в списке всех предметов
                state.items = state.items.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                );
                
                // Обновляем в списке моих предметов
                state.myItems = state.myItems.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                );
                
                // Обновляем в избранном
                state.favorites = state.favorites.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                );
                
                // Обновляем текущий предмет, если он был выбран
                if (state.currentItem?.id === updatedItem.id) {
                    state.currentItem = updatedItem;
                }
                
                state.error = null;
            })
            .addCase(updateItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка мягкого удаления предмета
            .addCase(softDeleteItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(softDeleteItem.fulfilled, (state, action) => {
                state.loading = false;
                const deletedId = action.payload;
                
                // Удаляем из списка всех предметов
                state.items = state.items.filter(item => item.id !== deletedId);
                
                // Удаляем из списка моих предметов
                state.myItems = state.myItems.filter(item => item.id !== deletedId);
                
                // Удаляем из избранного
                state.favorites = state.favorites.filter(item => item.id !== deletedId);
                
                // Если текущий предмет был удален, сбрасываем его
                if (state.currentItem?.id === deletedId) {
                    state.currentItem = null;
                }
                
                state.error = null;
            })
            .addCase(softDeleteItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка добавления/удаления из избранного
            .addCase(toggleFavorite.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(toggleFavorite.fulfilled, (state, action) => {
                state.loading = false;
                const { status, itemId } = action.payload;
                
                // Если текущий предмет - тот, для которого изменили статус избранного
                if (state.currentItem && state.currentItem.id === itemId) {
                    state.currentItem = {
                        ...state.currentItem,
                        is_favorited: status === 'added to favorites'
                    };
                }
                
                // Обновляем статус избранного в списке всех предметов
                state.items = state.items.map(item => {
                    if (item.id === itemId) {
                        return {
                            ...item,
                            is_favorited: status === 'added to favorites'
                        };
                    }
                    return item;
                });
                
                // Обновляем статус избранного в списке моих предметов
                state.myItems = state.myItems.map(item => {
                    if (item.id === itemId) {
                        return {
                            ...item,
                            is_favorited: status === 'added to favorites'
                        };
                    }
                    return item;
                });
                
                if (status === 'added to favorites') {
                    // Находим предмет в списке всех предметов
                    const favoritedItem = state.items.find(item => item.id === itemId);
                    if (favoritedItem && !state.favorites.some(item => item.id === itemId)) {
                        state.favorites.push(favoritedItem);
                    }
                } else {
                    // Удаляем из избранного
                    state.favorites = state.favorites.filter(item => item.id !== itemId);
                }
                
                state.error = null;
            })
            .addCase(toggleFavorite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка загрузки изображения
            .addCase(uploadItemImage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadItemImage.fulfilled, (state, action) => {
                state.loading = false;
                
                const newImage = action.payload;
                
                // Если у нас есть текущий предмет и изображение относится к нему
                if (state.currentItem) {
                    // Добавляем изображение в массив изображений текущего предмета
                    const updatedImages = [...state.currentItem.images, newImage];
                    
                    // Если изображение отмечено как основное, обновляем primary_image
                    const primaryImage = newImage.is_primary ? newImage.image_url : state.currentItem.primary_image;
                    
                    state.currentItem = {
                        ...state.currentItem,
                        images: updatedImages,
                        primary_image: primaryImage
                    };
                }
                
                state.error = null;
            })
            .addCase(uploadItemImage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка удаления изображения
            .addCase(deleteItemImage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteItemImage.fulfilled, (state, action) => {
                state.loading = false;
                
                const { itemId, imageId } = action.payload;
                
                // Если у нас есть текущий предмет и он совпадает с itemId
                if (state.currentItem && state.currentItem.id === itemId) {
                    // Удаляем изображение из массива изображений
                    const updatedImages = state.currentItem.images.filter(img => img.id !== imageId);
                    
                    // Проверяем, было ли удаленное изображение основным
                    const deletedImage = state.currentItem.images.find(img => img.id === imageId);
                    let primaryImage = state.currentItem.primary_image;
                    
                    if (deletedImage && deletedImage.is_primary) {
                        // Если удалили основное изображение, то надо найти новое основное
                        const newPrimary = updatedImages.find(img => img.is_primary);
                        primaryImage = newPrimary ? newPrimary.image_url : null;
                    }
                    
                    state.currentItem = {
                        ...state.currentItem,
                        images: updatedImages,
                        primary_image: primaryImage
                    };
                }
                
                state.error = null;
            })
            .addCase(deleteItemImage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка установки основного изображения
            .addCase(setPrimaryImage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(setPrimaryImage.fulfilled, (state, action) => {
                state.loading = false;
                
                const { imageId } = action.payload;
                
                // Если у нас есть текущий предмет
                if (state.currentItem) {
                    // Находим изображение, которое стало основным
                    const primaryImage = state.currentItem.images.find(img => img.id === imageId);
                    
                    if (primaryImage) {
                        // Обновляем все изображения, меняя флаг is_primary
                        const updatedImages = state.currentItem.images.map(img => ({
                            ...img,
                            is_primary: img.id === imageId
                        }));
                        
                        state.currentItem = {
                            ...state.currentItem,
                            images: updatedImages,
                            primary_image: primaryImage.image_url
                        };
                    }
                }
                
                state.error = null;
            })
            .addCase(setPrimaryImage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Обработка обновления предмета с изображениями
            .addCase(updateItemWithImages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateItemWithImages.fulfilled, (state, action) => {
                state.loading = false;
                const updatedItem = action.payload;
                
                // Обновляем в списке всех предметов
                state.items = state.items.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                );
                
                // Обновляем в списке моих предметов
                state.myItems = state.myItems.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                );
                
                // Обновляем в избранном
                state.favorites = state.favorites.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                );
                
                // Обновляем текущий предмет, если он был выбран
                if (state.currentItem?.id === updatedItem.id) {
                    state.currentItem = updatedItem;
                }
                
                state.error = null;
            })
            .addCase(updateItemWithImages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { 
    setItems, 
    setMyItems, 
    setUserItems,
    setFavorites,
    setCurrentItem, 
    setConditions,
    setStatuses,
    setTags,
    setUserLocations,
    setLoading, 
    setError, 
    clearItems,
    clearItemsError
} = itemsSlice.actions;

export default itemsSlice.reducer; 