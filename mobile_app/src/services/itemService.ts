import { axiosInstance } from './axiosInstance';
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
} from '../types/item';
import { UserLocation } from '../types/profile';

export const itemAPI = {
    // Получение списка предметов
    getItems: async (filter?: ItemFilter): Promise<ItemPaginatedResponse> => {
        console.log('Запрос на получение списка предметов с фильтрами:', filter);
        try {
            const params = new URLSearchParams();
            
            if (filter) {
                if (filter.category !== undefined) {
                    params.append('category', filter.category.toString());
                }
                if (filter.condition !== undefined) {
                    params.append('condition', filter.condition.toString());
                }
                if (filter.status !== undefined) {
                    params.append('status', filter.status.toString());
                }
                if (filter.search) {
                    params.append('search', filter.search);
                }
                if (filter.ordering) {
                    params.append('ordering', filter.ordering);
                }
                if (filter.page && filter.page > 1) {
                    params.append('page', filter.page.toString());
                }
                if (filter.owner !== undefined) {
                    params.append('owner', filter.owner.toString());
                }
            }

            const queryString = params.toString() ? `?${params.toString()}` : '';
            const response = await axiosInstance.get(`/items/${queryString}`);
            console.log('Получен список предметов:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении списка предметов:', error);
            throw error;
        }
    },

    // Получение детальной информации о предмете
    getItemById: async (id: number): Promise<Item> => {
        console.log(`Запрос на получение детальной информации о предмете с ID ${id}`);
        try {
            const response = await axiosInstance.get(`/items/${id}/`);
            console.log('Получена детальная информация о предмете:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Ошибка при получении предмета с ID ${id}:`, error);
            throw error;
        }
    },

    // Создание предмета
    createItem: async (data: CreateItemData): Promise<Item> => {
        console.log('Создание нового предмета с данными:', data);
        try {
            const response = await axiosInstance.post('/items/', data);
            console.log('Предмет успешно создан:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при создании предмета:', error);
            throw error;
        }
    },

    // Обновление предмета
    updateItem: async (data: UpdateItemData): Promise<Item> => {
        console.log(`Обновление предмета с ID ${data.id}:`, data);
        try {
            const { id, ...updateData } = data;
            const response = await axiosInstance.patch(`/items/${id}/`, updateData);
            console.log('Предмет успешно обновлен:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Ошибка при обновлении предмета с ID ${data.id}:`, error);
            throw error;
        }
    },

    // Мягкое удаление предмета
    softDeleteItem: async (id: number): Promise<void> => {
        console.log(`Мягкое удаление предмета с ID ${id}`);
        try {
            await axiosInstance.delete(`/items/${id}/soft_delete/`);
            console.log(`Предмет с ID ${id} успешно удален (мягкое удаление)`);
        } catch (error: any) {
            console.error(`Ошибка при мягком удалении предмета с ID ${id}:`, error);
            throw error;
        }
    },

    // Получение предметов текущего пользователя
    getMyItems: async (): Promise<ItemPaginatedResponse> => {
        console.log('Запрос на получение предметов текущего пользователя');
        try {
            const response = await axiosInstance.get('/items/my/');
            console.log('Получены предметы текущего пользователя:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении предметов текущего пользователя:', error);
            throw error;
        }
    },

    // Добавление/удаление из избранного
    toggleFavorite: async (id: number): Promise<{ status: string }> => {
        console.log(`Добавление/удаление из избранного предмета с ID ${id}`);
        try {
            const response = await axiosInstance.post(`/items/${id}/favorite/`);
            console.log('Результат операции с избранным:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Ошибка при добавлении/удалении из избранного предмета с ID ${id}:`, error);
            throw error;
        }
    },

    // Получение избранных предметов
    getFavorites: async (): Promise<ItemPaginatedResponse> => {
        console.log('Запрос на получение избранных предметов');
        try {
            const response = await axiosInstance.get('/items/favorites/');
            console.log('Получены избранные предметы:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении избранных предметов:', error);
            throw error;
        }
    },

    // Получение изображений предмета
    getItemImages: async (id: number): Promise<ItemImage[]> => {
        console.log(`Запрос на получение изображений предмета с ID ${id}`);
        try {
            const response = await axiosInstance.get(`/items/${id}/images/`);
            console.log('Получены изображения предмета:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Ошибка при получении изображений предмета с ID ${id}:`, error);
            throw error;
        }
    },

    // Загрузка изображения
    uploadImage: async (itemId: number, image: any): Promise<ItemImage> => {
        console.log(`Загрузка изображения для предмета с ID ${itemId}`);
        try {
            const formData = new FormData();
            
            // Проверяем, является ли image строкой с путем к файлу
            if (typeof image === 'string' && image.startsWith('file://')) {
                // Обработка локального пути к файлу
                const fileName = image.split('/').pop() || 'image.jpg';
                const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
                
                formData.append('image', {
                    uri: image,
                    type: fileType,
                    name: fileName
                } as any);
            } else {
                // Обычная обработка
                formData.append('image', image);
            }

            const response = await axiosInstance.post(`/items/${itemId}/upload-image/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            console.log('Изображение успешно загружено:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Ошибка при загрузке изображения для предмета с ID ${itemId}:`, error);
            throw error;
        }
    },

    // Удаление изображения
    deleteImage: async (itemId: number, imageId: number): Promise<void> => {
        console.log(`Удаление изображения ${imageId} для предмета с ID ${itemId}`);
        try {
            await axiosInstance.delete(`/items/${itemId}/delete-image/?image_id=${imageId}`);
            console.log(`Изображение ${imageId} для предмета с ID ${itemId} успешно удалено`);
        } catch (error: any) {
            console.error(`Ошибка при удалении изображения ${imageId} для предмета с ID ${itemId}:`, error);
            throw error;
        }
    },

    // Установка основного изображения
    setPrimaryImage: async (imageId: number): Promise<{ status: string }> => {
        console.log(`Установка изображения ${imageId} в качестве основного`);
        try {
            const response = await axiosInstance.post(`/items/images/${imageId}/set-primary/`);
            console.log('Изображение успешно установлено в качестве основного:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Ошибка при установке изображения ${imageId} в качестве основного:`, error);
            throw error;
        }
    },

    // Получение всех состояний предметов
    getConditions: async (): Promise<ItemCondition[]> => {
        console.log('Запрос на получение всех состояний предметов');
        try {
            const response = await axiosInstance.get('/conditions/');
            console.log('Получены состояния предметов:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении состояний предметов:', error);
            throw error;
        }
    },

    // Получение всех статусов предметов
    getStatuses: async (): Promise<ItemStatus[]> => {
        console.log('Запрос на получение всех статусов предметов');
        try {
            const response = await axiosInstance.get('/statuses/');
            console.log('Получены статусы предметов:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении статусов предметов:', error);
            throw error;
        }
    },

    // Получение всех тегов
    getTags: async (search?: string): Promise<ItemTag[]> => {
        console.log('Запрос на получение всех тегов');
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const response = await axiosInstance.get(`/tags/${params}`);
            console.log('Получены теги:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении тегов:', error);
            throw error;
        }
    },

    // Создание нового тега
    createTag: async (name: string): Promise<ItemTag> => {
        console.log('Запрос на создание нового тега:', name);
        try {
            const response = await axiosInstance.post('/tags/', { name });
            console.log('Создан новый тег:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при создании нового тега:', error);
            throw error;
        }
    },

    // Создание предмета с изображениями
    createItemWithImages: async (data: CreateItemData, images: any[]): Promise<Item> => {
        console.log('Создание предмета с данными и изображениями:', data);
        try {
            // Сначала создаем предмет
            const itemResponse = await axiosInstance.post('/items/', data);
            console.log('Предмет успешно создан:', itemResponse.data);
            
            const newItem = itemResponse.data;
            const itemId = newItem.id;
            
            // Проверяем что ID существует
            if (!itemId) {
                console.error('ID предмета не найден в ответе API:', newItem);
                throw new Error('ID предмета не найден в ответе от сервера');
            }
            
            console.log('Получен ID предмета:', itemId);
            
            // Если есть изображения, загружаем их
            if (images && images.length > 0) {
                console.log(`Загрузка ${images.length} изображений для предмета ID ${itemId}`);
                
                for (let i = 0; i < images.length; i++) {
                    const image = images[i];
                    try {
                        const formData = new FormData();
                        
                        // Проверяем, является ли image строкой с путем к файлу
                        if (typeof image === 'string' && image.startsWith('file://')) {
                            // Обработка локального пути к файлу
                            const fileName = image.split('/').pop() || 'image.jpg';
                            const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
                            
                            formData.append('image', {
                                uri: image,
                                type: fileType,
                                name: fileName
                            } as any);
                        } else {
                            // Обычная обработка
                            formData.append('image', image);
                        }
                        
                        const imageResponse = await axiosInstance.post(`/items/${itemId}/upload-image/`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            }
                        });
                        
                        console.log(`Изображение ${i + 1}/${images.length} успешно загружено:`, imageResponse.data);
                        
                        // Если это первое изображение, обновляем первичное изображение предмета
                        if (i === 0) {
                            newItem.primary_image = imageResponse.data.image_url;
                        }
                    } catch (imageError) {
                        console.error(`Ошибка при загрузке изображения ${i + 1}/${images.length}:`, imageError);
                        // Продолжаем загрузку других изображений, даже если одно не удалось
                    }
                }
                
                // Получаем обновленный предмет с загруженными изображениями
                try {
                    const updatedItemResponse = await axiosInstance.get(`/items/${itemId}/`);
                    console.log('Получен обновленный предмет с изображениями:', updatedItemResponse.data);
                    return updatedItemResponse.data;
                } catch (error) {
                    console.error('Ошибка при получении обновленного предмета:', error);
                    // Возвращаем исходный предмет, если не удалось получить обновленный
                    return newItem;
                }
            }
            
            return newItem;
        } catch (error: any) {
            console.error('Ошибка при создании предмета с изображениями:', error);
            throw error;
        }
    },

    // Получение адресов пользователя для выбора при создании/редактировании товара
    getUserLocations: async (): Promise<UserLocation[]> => {
        console.log('Запрос на получение адресов пользователя');
        try {
            const response = await axiosInstance.get('/profiles/locations/');
            console.log('Получены адреса пользователя:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при получении адресов пользователя:', error);
            throw error;
        }
    }
}; 