import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TextInput, 
    TouchableOpacity, 
    Switch,
    Image,
    Alert,
    Platform
} from 'react-native';
import { Category, CreateCategoryData, UpdateCategoryData } from '../../../types/category';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
    createCategory, 
    updateCategory, 
    fetchCategories 
} from '../../../features/categories/categoriesThunks';
import { Loading } from '../../common/Loading';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';

interface AdminCategoryFormProps {
    category: Category | null;
    onClose: () => void;
}

export const AdminCategoryForm: React.FC<AdminCategoryFormProps> = ({ 
    category, 
    onClose 
}) => {
    console.log('[AdminCategoryForm] Инициализация компонента, режим:', category ? 'редактирование' : 'создание');
    if (category) {
        console.log('[AdminCategoryForm] Данные редактируемой категории:', category);
    }
    
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.categories);
    const [parentOptions, setParentOptions] = useState<Category[]>([]);
    const [submitting, setSubmitting] = useState(false);
    
    // Состояние формы
    const [formData, setFormData] = useState<CreateCategoryData | UpdateCategoryData>({
        name: '',
        slug: '',
        description: '',
        parent: null,
        icon: null,
        is_active: true,
        order: 0,
    });
    
    // Состояние ошибок валидации
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Загрузка списка родительских категорий
    useEffect(() => {
        const loadParentOptions = async () => {
            console.log('[AdminCategoryForm] Загрузка списка родительских категорий');
            try {
                const result = await dispatch(fetchCategories({})).unwrap();
                
                // Проверка результата
                if (!result || !Array.isArray(result)) {
                    console.error('[AdminCategoryForm] Ошибка: результат не является массивом:', result);
                    setParentOptions([]);
                    return;
                }
                
                console.log('[AdminCategoryForm] Загружено родительских категорий:', result.length);
                if (result.length > 0) {
                    console.log('[AdminCategoryForm] Примеры загруженных категорий:', result.slice(0, 3));
                }
                
                setParentOptions(result);
            } catch (error) {
                console.error('[AdminCategoryForm] Ошибка при загрузке родительских категорий:', error);
                setParentOptions([]);
            }
        };
        
        loadParentOptions();
    }, [dispatch]);
    
    // Заполнение формы данными категории при редактировании
    useEffect(() => {
        if (category) {
            console.log('[AdminCategoryForm] Заполнение формы данными категории:', category.id);
            setFormData({
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                parent: category.parent,
                is_active: category.is_active,
                order: category.order || 0,
            });
            console.log('[AdminCategoryForm] Форма заполнена данными');
        }
    }, [category]);
    
    const handleChange = (name: string, value: any) => {
        console.log(`[AdminCategoryForm] Изменение поля ${name}:`, value);
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        
        // Очистка ошибки при изменении поля
        if (errors[name]) {
            console.log(`[AdminCategoryForm] Очистка ошибки для поля ${name}`);
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const validateForm = (): boolean => {
        console.log('[AdminCategoryForm] Валидация формы');
        const newErrors: Record<string, string> = {};
        
        if (!formData.name?.trim()) {
            console.log('[AdminCategoryForm] Ошибка валидации: пустое имя категории');
            newErrors.name = 'Название категории обязательно';
        }
        
        if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
            console.log('[AdminCategoryForm] Ошибка валидации: некорректный slug');
            newErrors.slug = 'Slug должен содержать только строчные буквы, цифры и дефисы';
        }
        
        setErrors(newErrors);
        const isValid = Object.keys(newErrors).length === 0;
        console.log('[AdminCategoryForm] Результат валидации:', isValid ? 'успешно' : 'есть ошибки');
        return isValid;
    };
    
    const handleSubmit = async () => {
        console.log('[AdminCategoryForm] Отправка формы, данные:', JSON.stringify(formData, null, 2));
        
        if (!validateForm()) {
            console.log('[AdminCategoryForm] Форма не прошла валидацию, отправка отменена');
            return;
        }
        
        // Дополнительная проверка обязательных полей
        if (!formData.name) {
            console.error('[AdminCategoryForm] Отсутствует обязательное поле name');
            Alert.alert('Ошибка', 'Название категории обязательно');
            return;
        }
        
        // Создаем копию данных для отправки, чтобы избежать возможных проблем с мутацией
        const dataToSend = { ...formData };
        
        console.log('[AdminCategoryForm] Форма прошла валидацию, подготовленные данные:', dataToSend);
        
        setSubmitting(true);
        try {
            if (category) {
                console.log('[AdminCategoryForm] Обновление категории с ID:', category.id);
                // Обновление категории
                const result = await dispatch(updateCategory(dataToSend as UpdateCategoryData)).unwrap();
                console.log('[AdminCategoryForm] Категория успешно обновлена:', result);
                Alert.alert('Успех', 'Категория успешно обновлена');
            } else {
                console.log('[AdminCategoryForm] Создание новой категории');
                // Создание категории
                const result = await dispatch(createCategory(dataToSend as CreateCategoryData)).unwrap();
                console.log('[AdminCategoryForm] Категория успешно создана:', result);
                Alert.alert('Успех', 'Категория успешно создана');
            }
            console.log('[AdminCategoryForm] Закрытие формы после успешного сохранения');
            onClose();
        } catch (error: any) {
            console.error('[AdminCategoryForm] Ошибка при сохранении категории:', error);
            let errorMessage = 'Произошла ошибка при сохранении категории';
            
            if (error.response?.data) {
                console.error('[AdminCategoryForm] Ошибка от сервера:', error.response.data);
                
                // Обработка ошибок валидации с сервера
                const serverErrors = error.response.data;
                const newErrors: Record<string, string> = {};
                
                Object.entries(serverErrors).forEach(([field, messages]: [string, any]) => {
                    if (Array.isArray(messages)) {
                        newErrors[field] = messages[0];
                    } else {
                        newErrors[field] = messages;
                    }
                });
                
                console.log('[AdminCategoryForm] Обработанные ошибки валидации:', newErrors);
                setErrors(newErrors);
                errorMessage = 'Пожалуйста, исправьте ошибки в форме';
            }
            
            Alert.alert('Ошибка', errorMessage);
        } finally {
            console.log('[AdminCategoryForm] Завершение процесса отправки формы');
            setSubmitting(false);
        }
    };
    
    const selectImage = async () => {
        console.log('[AdminCategoryForm] Запуск выбора изображения');
        try {
            // Запрос разрешения на доступ к галерее
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log('[AdminCategoryForm] Статус разрешения на доступ к галерее:', status);
            
            if (status !== 'granted') {
                console.log('[AdminCategoryForm] Доступ к галерее не предоставлен');
                Alert.alert('Ошибка', 'Извините, нам нужно разрешение на доступ к вашим фотографиям!');
                return;
            }
            
            // Запуск выбора изображения
            console.log('[AdminCategoryForm] Запуск выбора изображения из галереи');
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            
            console.log('[AdminCategoryForm] Результат выбора изображения:', result.canceled ? 'отменено' : 'выбрано');
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                console.log('[AdminCategoryForm] Выбранное изображение:', selectedAsset.uri);
                
                // Создание объекта для отправки на сервер
                const localUri = selectedAsset.uri;
                const filename = localUri.split('/').pop() || 'image.jpg';
                
                // Определение типа файла
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                
                console.log('[AdminCategoryForm] Создание объекта для изображения:', {
                    uri: localUri,
                    name: filename,
                    type,
                });
                
                // @ts-ignore - игнорируем ошибку типа для FileList
                const iconFile = {
                    uri: localUri,
                    name: filename,
                    type,
                };
                
                handleChange('icon', iconFile);
            }
        } catch (error) {
            console.error('[AdminCategoryForm] Ошибка при выборе изображения:', error);
            Alert.alert('Ошибка', 'Не удалось выбрать изображение');
        }
    };
    
    if (loading || submitting) {
        return <Loading text={category ? 'Обновление категории...' : 'Создание категории...'} />;
    }
    
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {category ? 'Редактирование категории' : 'Создание категории'}
                </Text>
                <TouchableOpacity onPress={onClose}>
                    <Icon name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.form}>
                {/* Название */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Название *</Text>
                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        value={formData.name}
                        onChangeText={(value) => handleChange('name', value)}
                        placeholder="Введите название категории"
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>
                
                {/* Slug */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Slug</Text>
                    <TextInput
                        style={[styles.input, errors.slug && styles.inputError]}
                        value={formData.slug}
                        onChangeText={(value) => handleChange('slug', value)}
                        placeholder="например: elektronika (оставьте пустым для автогенерации)"
                    />
                    {errors.slug && <Text style={styles.errorText}>{errors.slug}</Text>}
                </View>
                
                {/* Описание */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Описание</Text>
                    <TextInput
                        style={[styles.textArea, errors.description && styles.inputError]}
                        value={formData.description}
                        onChangeText={(value) => handleChange('description', value)}
                        placeholder="Введите описание категории"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                    {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
                </View>
                
                {/* Родительская категория */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Родительская категория</Text>
                    <View style={styles.pickerContainer}>
                        <TouchableOpacity
                            style={[styles.input, styles.pickerButton]}
                            onPress={() => {
                                // Здесь можно реализовать модальное окно выбора родительской категории
                                Alert.alert(
                                    'Родительская категория',
                                    'Выберите родительскую категорию',
                                    [
                                        {
                                            text: 'Нет (корневая категория)',
                                            onPress: () => handleChange('parent', null)
                                        },
                                        ...parentOptions
                                            .filter(cat => cat.id !== category?.id) // Исключаем текущую категорию
                                            .map(cat => ({
                                                text: `${cat.name} (ID: ${cat.id})`,
                                                onPress: () => handleChange('parent', cat.id)
                                            }))
                                    ]
                                );
                            }}
                        >
                            <Text>
                                {formData.parent === null 
                                    ? 'Нет (корневая категория)' 
                                    : parentOptions.find(c => c.id === formData.parent)?.name || `ID: ${formData.parent}`
                                }
                            </Text>
                            <Icon name="arrow-drop-down" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    {errors.parent && <Text style={styles.errorText}>{errors.parent}</Text>}
                </View>
                
                {/* Порядок отображения */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Порядок отображения</Text>
                    <TextInput
                        style={[styles.input, errors.order && styles.inputError]}
                        value={formData.order?.toString() || '0'}
                        onChangeText={(value) => handleChange('order', parseInt(value) || 0)}
                        keyboardType="numeric"
                        placeholder="0"
                    />
                    {errors.order && <Text style={styles.errorText}>{errors.order}</Text>}
                </View>
                
                {/* Активность */}
                <View style={styles.formGroup}>
                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Активна</Text>
                        <Switch
                            value={formData.is_active}
                            onValueChange={(value) => handleChange('is_active', value)}
                            trackColor={{ false: '#f4f3f4', true: '#81c784' }}
                            thumbColor={formData.is_active ? '#4caf50' : '#f4f3f4'}
                        />
                    </View>
                    {errors.is_active && <Text style={styles.errorText}>{errors.is_active}</Text>}
                </View>
                
                {/* Иконка категории */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Иконка категории</Text>
                    <View style={styles.imageContainer}>
                        {formData.icon ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image 
                                    source={
                                        typeof formData.icon === 'string'
                                            ? { uri: formData.icon }
                                            : { uri: (formData.icon as any).uri }
                                    }
                                    style={styles.imagePreview} 
                                    resizeMode="contain"
                                />
                                <TouchableOpacity 
                                    style={styles.imageRemoveButton}
                                    onPress={() => handleChange('icon', null)}
                                >
                                    <Icon name="close" size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={styles.imageUploadButton}
                                onPress={selectImage}
                            >
                                <Icon name="add-photo-alternate" size={24} color="#1976d2" />
                                <Text style={styles.imageUploadText}>Выбрать изображение</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {errors.icon && <Text style={styles.errorText}>{errors.icon}</Text>}
                </View>
                
                {/* Кнопки действий */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={[styles.button, styles.cancelButton]} 
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Отмена</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.button, styles.submitButton]} 
                        onPress={handleSubmit}
                    >
                        <Text style={styles.submitButtonText}>
                            {category ? 'Сохранить' : 'Создать'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#1976d2',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    form: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#e53935',
    },
    errorText: {
        color: '#e53935',
        fontSize: 12,
        marginTop: 4,
    },
    textArea: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        minHeight: 100,
    },
    pickerContainer: {
        backgroundColor: 'white',
        borderRadius: 4,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    imageUploadButton: {
        width: '100%',
        height: 120,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    imageUploadText: {
        marginTop: 8,
        fontSize: 14,
        color: '#1976d2',
    },
    imagePreviewContainer: {
        position: 'relative',
        width: 120,
        height: 120,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    imageRemoveButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#e53935',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 8,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#4caf50',
        marginLeft: 8,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 