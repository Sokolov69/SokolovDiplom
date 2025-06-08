import { createAsyncThunk } from '@reduxjs/toolkit';
import { itemAPI } from '../../services/itemService';
import { 
    Item, 
    ItemShort, 
    ItemCondition,
    ItemStatus, 
    ItemTag,
    ItemImage,
    ItemFilter,
    ItemPaginatedResponse,
    CreateItemData,
    UpdateItemData
} from '../../types/item';
import { UserLocation } from '../../types/profile';

// Получение списка предметов
export const fetchItems = createAsyncThunk<ItemPaginatedResponse, ItemFilter | undefined>(
    'items/fetchItems',
    async (filter, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение списка предметов с фильтрами:', filter);
            const response = await itemAPI.getItems(filter);
            console.log('Thunk: Получен список предметов:', response);
            if (response.results && response.results.length > 0) {
                console.log('Первый предмет tags:', response.results[0].tags);
                console.log('Первый предмет owner_details:', response.results[0].owner_details);
            }
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении списка предметов:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить предметы';
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение детальной информации о предмете
export const fetchItemById = createAsyncThunk<Item, number>(
    'items/fetchItemById',
    async (id, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Запрос на получение детальной информации о предмете с ID ${id}`);
            const response = await itemAPI.getItemById(id);
            console.log('Thunk: Получена детальная информация о предмете:', response);
            console.log('Thunk: owner_details предмета:', response.owner_details);
            return response;
        } catch (error: any) {
            console.error(`Thunk: Ошибка при получении предмета с ID ${id}:`, error);
            const errorMessage = error.response?.data?.detail || `Не удалось загрузить предмет с ID ${id}`;
            return rejectWithValue(errorMessage);
        }
    }
);

// Создание предмета
export const createItem = createAsyncThunk<Item, CreateItemData>(
    'items/createItem',
    async (data, { rejectWithValue }) => {
        try {
            console.log('Thunk: Создание нового предмета с данными:', data);
            const response = await itemAPI.createItem(data);
            console.log('Thunk: Предмет успешно создан:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при создании предмета:', error);
            let errorMessage = 'Не удалось создать предмет';
            
            if (error.response?.data) {
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
            
            return rejectWithValue(errorMessage);
        }
    }
);

// Обновление предмета
export const updateItem = createAsyncThunk<Item, UpdateItemData>(
    'items/updateItem',
    async (data, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Обновление предмета с ID ${data.id}:`, data);
            const response = await itemAPI.updateItem(data);
            console.log('Thunk: Предмет успешно обновлен:', response);
            return response;
        } catch (error: any) {
            console.error(`Thunk: Ошибка при обновлении предмета с ID ${data.id}:`, error);
            let errorMessage = `Не удалось обновить предмет с ID ${data.id}`;
            
            if (error.response?.data) {
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
            
            return rejectWithValue(errorMessage);
        }
    }
);

// Мягкое удаление предмета
export const softDeleteItem = createAsyncThunk<number, number>(
    'items/softDeleteItem',
    async (id, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Мягкое удаление предмета с ID ${id}`);
            await itemAPI.softDeleteItem(id);
            console.log(`Thunk: Предмет с ID ${id} успешно удален (мягкое удаление)`);
            return id;
        } catch (error: any) {
            console.error(`Thunk: Ошибка при мягком удалении предмета с ID ${id}:`, error);
            const errorMessage = error.response?.data?.detail || `Не удалось удалить предмет с ID ${id}`;
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение предметов текущего пользователя
export const fetchMyItems = createAsyncThunk<ItemPaginatedResponse>(
    'items/fetchMyItems',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение предметов текущего пользователя');
            const response = await itemAPI.getMyItems();
            console.log('Thunk: Получены предметы текущего пользователя:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении предметов текущего пользователя:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить ваши предметы';
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение предметов конкретного пользователя
export const fetchUserItems = createAsyncThunk<ItemPaginatedResponse, number>(
    'items/fetchUserItems',
    async (userId, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Запрос на получение предметов пользователя с ID ${userId}`);
            const response = await itemAPI.getItems({ owner: userId });
            console.log('Thunk: Получены предметы пользователя:', response);
            return response;
        } catch (error: any) {
            console.error(`Thunk: Ошибка при получении предметов пользователя с ID ${userId}:`, error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить предметы пользователя';
            return rejectWithValue(errorMessage);
        }
    }
);

// Добавление/удаление из избранного
export const toggleFavorite = createAsyncThunk<{ status: string; itemId: number }, number>(
    'items/toggleFavorite',
    async (id, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Добавление/удаление из избранного предмета с ID ${id}`);
            const response = await itemAPI.toggleFavorite(id);
            console.log('Thunk: Результат операции с избранным:', response);
            return { ...response, itemId: id };
        } catch (error: any) {
            console.error(`Thunk: Ошибка при добавлении/удалении из избранного предмета с ID ${id}:`, error);
            const errorMessage = error.response?.data?.detail || `Ошибка при добавлении/удалении из избранного`;
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение избранных предметов
export const fetchFavorites = createAsyncThunk<ItemPaginatedResponse>(
    'items/fetchFavorites',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение избранных предметов');
            const response = await itemAPI.getFavorites();
            console.log('Thunk: Получены избранные предметы:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении избранных предметов:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить избранные предметы';
            return rejectWithValue(errorMessage);
        }
    }
);

// Загрузка изображения
export const uploadItemImage = createAsyncThunk<
    ItemImage, 
    { itemId: number; image: any }
>(
    'items/uploadItemImage',
    async ({ itemId, image }, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Загрузка изображения для предмета с ID ${itemId}`);
            const response = await itemAPI.uploadImage(itemId, image);
            console.log('Thunk: Изображение успешно загружено:', response);
            return response;
        } catch (error: any) {
            console.error(`Thunk: Ошибка при загрузке изображения для предмета с ID ${itemId}:`, error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить изображение';
            return rejectWithValue(errorMessage);
        }
    }
);

// Удаление изображения
export const deleteItemImage = createAsyncThunk<
    { itemId: number; imageId: number }, 
    { itemId: number; imageId: number }
>(
    'items/deleteItemImage',
    async ({ itemId, imageId }, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Удаление изображения ${imageId} для предмета с ID ${itemId}`);
            await itemAPI.deleteImage(itemId, imageId);
            console.log(`Thunk: Изображение ${imageId} для предмета с ID ${itemId} успешно удалено`);
            return { itemId, imageId };
        } catch (error: any) {
            console.error(`Thunk: Ошибка при удалении изображения ${imageId} для предмета с ID ${itemId}:`, error);
            const errorMessage = error.response?.data?.detail || 'Не удалось удалить изображение';
            return rejectWithValue(errorMessage);
        }
    }
);

// Установка основного изображения
export const setPrimaryImage = createAsyncThunk<
    { status: string; imageId: number }, 
    number
>(
    'items/setPrimaryImage',
    async (imageId, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Установка изображения ${imageId} в качестве основного`);
            const response = await itemAPI.setPrimaryImage(imageId);
            console.log('Thunk: Изображение успешно установлено в качестве основного:', response);
            return { ...response, imageId };
        } catch (error: any) {
            console.error(`Thunk: Ошибка при установке изображения ${imageId} в качестве основного:`, error);
            const errorMessage = error.response?.data?.detail || 'Не удалось установить основное изображение';
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение всех состояний предметов
export const fetchItemConditions = createAsyncThunk<ItemCondition[]>(
    'items/fetchItemConditions',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение всех состояний предметов');
            const response = await itemAPI.getConditions();
            console.log('Thunk: Получены состояния предметов:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении состояний предметов:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить состояния предметов';
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение всех статусов предметов
export const fetchItemStatuses = createAsyncThunk<ItemStatus[]>(
    'items/fetchItemStatuses',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение всех статусов предметов');
            const response = await itemAPI.getStatuses();
            console.log('Thunk: Получены статусы предметов:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении статусов предметов:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить статусы предметов';
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение всех тегов
export const fetchItemTags = createAsyncThunk<ItemTag[], string | undefined>(
    'items/fetchItemTags',
    async (search, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение всех тегов');
            const response = await itemAPI.getTags(search);
            console.log('Thunk: Получены теги:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении тегов:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить теги';
            return rejectWithValue(errorMessage);
        }
    }
);

// Создание нового тега
export const createTag = createAsyncThunk<ItemTag, string>(
    'items/createTag',
    async (name, { rejectWithValue }) => {
        try {
            console.log('Thunk: Создание нового тега с именем:', name);
            const response = await itemAPI.createTag(name);
            console.log('Thunk: Создан новый тег:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при создании нового тега:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось создать новый тег';
            return rejectWithValue(errorMessage);
        }
    }
);

// Создание предмета с изображениями
export const createItemWithImages = createAsyncThunk<
    Item, 
    { itemData: CreateItemData; images: any[] }
>(
    'items/createItemWithImages',
    async ({ itemData, images }, { rejectWithValue }) => {
        try {
            console.log('Thunk: Создание нового предмета с данными и изображениями:', itemData);
            console.log('Thunk: Количество изображений:', images.length);
            
            const response = await itemAPI.createItemWithImages(itemData, images);
            console.log('Thunk: Предмет успешно создан с изображениями:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при создании предмета с изображениями:', error);
            let errorMessage = 'Не удалось создать предмет';
            
            if (error.response?.data) {
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
            
            return rejectWithValue(errorMessage);
        }
    }
);

// Обновление предмета с изображениями
export const updateItemWithImages = createAsyncThunk<
    Item, 
    { itemId: number; itemData: UpdateItemData; newImages: any[]; existingImages: string[] }
>(
    'items/updateItemWithImages',
    async ({ itemId, itemData, newImages, existingImages }, { rejectWithValue }) => {
        try {
            console.log(`Thunk: Обновление предмета с ID ${itemId} с данными и изображениями:`, itemData);
            console.log('Thunk: Количество новых изображений:', newImages.length);
            console.log('Thunk: Количество существующих изображений:', existingImages.length);
            
            // Подготавливаем данные для обновления
            const updateData: UpdateItemData = {
                ...itemData,
                id: itemId
            };
            
            // Обновляем данные предмета
            const response = await itemAPI.updateItem(updateData);
            console.log('Thunk: Предмет успешно обновлен:', response);
            
            // Загружаем новые изображения, если они есть
            if (newImages && newImages.length > 0) {
                console.log(`Thunk: Загрузка ${newImages.length} новых изображений для предмета ID ${itemId}`);
                
                for (let i = 0; i < newImages.length; i++) {
                    const image = newImages[i];
                    try {
                        console.log(`Thunk: Загрузка изображения ${i + 1}/${newImages.length}:`, typeof image === 'string' ? 'Путь к файлу' : 'Объект файла');
                        const imageResponse = await itemAPI.uploadImage(itemId, image);
                        console.log(`Thunk: Изображение ${i + 1}/${newImages.length} успешно загружено:`, imageResponse);
                    } catch (imageError: any) {
                        console.error(`Thunk: Ошибка при загрузке изображения ${i + 1}/${newImages.length}:`, imageError);
                        console.error('Детали ошибки:', imageError.response?.data || imageError.message);
                        // Продолжаем загрузку других изображений, даже если одно не удалось
                    }
                }
            }
            
            // Получаем обновленный предмет с изображениями
            const updatedItem = await itemAPI.getItemById(itemId);
            console.log('Thunk: Получен обновленный предмет с изображениями:', updatedItem);
            
            return updatedItem;
        } catch (error: any) {
            console.error(`Thunk: Ошибка при обновлении предмета с ID ${itemId} с изображениями:`, error);
            let errorMessage = `Не удалось обновить предмет с ID ${itemId}`;
            
            if (error.response?.data) {
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
            
            return rejectWithValue(errorMessage);
        }
    }
);

// Получение адресов пользователя для выбора при создании/редактировании товара
export const fetchUserLocations = createAsyncThunk<UserLocation[]>(
    'items/fetchUserLocations',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Thunk: Запрос на получение адресов пользователя');
            const response = await itemAPI.getUserLocations();
            console.log('Thunk: Получены адреса пользователя:', response);
            return response;
        } catch (error: any) {
            console.error('Thunk: Ошибка при получении адресов пользователя:', error);
            
            // Если получили 404, это означает что у пользователя нет адресов
            // Возвращаем пустой массив вместо ошибки
            if (error.response?.status === 404) {
                console.log('Thunk: 404 ошибка, возвращаем пустой список адресов');
                return [];
            }
            
            const errorMessage = error.response?.data?.detail || 'Не удалось загрузить адреса';
            return rejectWithValue(errorMessage);
        }
    }
); 