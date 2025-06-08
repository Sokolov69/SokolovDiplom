import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ItemCondition, CreateItemData} from '../types/item';
import {
    createItemWithImages,
    fetchItemConditions,
    fetchItemStatuses,
    fetchItemTags,
    fetchUserLocations,
    createTag
} from '../features/items/itemsThunks';
import {fetchCategories} from '../features/categories/categoriesThunks';
import {useAppDispatch, useAppSelector} from "../store/hooks";
import {Loading} from '../components/common/Loading';
import {CustomButton} from '../components/common/CustomButton';
import {
    BasicInfoSection,
    CategorySection,
    ConditionSection,
    PriceSection,
    ImagesSection
} from '../components/items/ItemFormComponents';
import ItemTagsSection from '../components/items/ItemTagsSection';
import LocationSection from '../components/items/LocationSection';
import {CategorySelectDialog} from '../components/items/CategorySelectDialog';
import {TagDialog} from '../components/items/TagDialog';
import {TagsSelectDialog} from '../components/items/TagsSelectDialog';
import LocationSelectDialog from '../components/items/LocationSelectDialog';

const CreateItemPage = () => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation();

    const {items: categories} = useAppSelector((state) => state.categories);
    const {conditions, statuses, tags, userLocations, loading, error} = useAppSelector((state) => state.items);

    // Состояния формы
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<number | null>(null);
    const [condition, setCondition] = useState<ItemCondition | null>(null);
    const [location, setLocation] = useState<number | null>(null);
    const [price, setPrice] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);

    // Состояние для отслеживания загрузки
    const [isUploading, setIsUploading] = useState(false);

    // Состояния для поиска и добавления тегов
    const [tagSearchText, setTagSearchText] = useState('');
    const [tagDialogVisible, setTagDialogVisible] = useState(false);
    const [tagsSelectDialogVisible, setTagsSelectDialogVisible] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [tagError, setTagError] = useState<string | null>(null);

    // Состояние для выбора категории
    const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);

    // Состояние для выбора адреса
    const [locationDialogVisible, setLocationDialogVisible] = useState(false);

    // Загрузка необходимых данных при монтировании компонента
    useEffect(() => {
        dispatch(fetchItemConditions());
        dispatch(fetchItemStatuses());
        dispatch(fetchItemTags());
        dispatch(fetchUserLocations());
        dispatch(fetchCategories({is_active: true}));
    }, [dispatch]);

    // Очистка формы
    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategory(null);
        setCondition(null);
        setLocation(null);
        setPrice('');
        setSelectedTags([]);
        setImages([]);
    };

    // Обработка сохранения нового предмета
    const handleSaveItem = async () => {
        if (!title || !description || !category || !condition) {
            Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля');
            return;
        }

        try {
            // Используем первый статус из списка (обычно "Активный" или "Доступен")
            const defaultStatus = statuses.length > 0 ? statuses[0].id : 1;

            const itemData: CreateItemData = {
                title,
                description,
                category: category!,
                status: defaultStatus,
                condition: condition!.id,
                location: location, // Может быть null
                estimated_value: price ? parseFloat(price) : undefined,
                tags: selectedTags
            };

            console.log('Создание предмета с данными:', JSON.stringify(itemData));
            console.log('Выбранные изображения:', images.length);

            // Устанавливаем состояние загрузки
            setIsUploading(true);

            // Создаем предмет с изображениями в одном запросе
            const createdItem = await dispatch(createItemWithImages({
                itemData,
                images
            })).unwrap();

            console.log('Предмет успешно создан с изображениями:', JSON.stringify(createdItem));

            setIsUploading(false);

            Alert.alert('Успех', 'Предмет успешно создан', [
                {
                    text: 'OK', onPress: () => {
                        resetForm();
                        // @ts-ignore
                        navigation.navigate('Profile');
                    }
                }
            ]);
        } catch (err: any) {
            setIsUploading(false);
            console.error('Ошибка при создании предмета:', err);
            const errorMessage = err.message || 'Не удалось создать предмет. Пожалуйста, попробуйте снова.';
            Alert.alert('Ошибка', errorMessage);
        }
    };

    // Обработка выбора изображений
    const handleImagesSelected = (selectedImages: string[]) => {
        setImages(selectedImages);
    };

    // Отображение диалога выбора категорий
    const showCategoryDialog = () => setCategoryDialogVisible(true);
    const hideCategoryDialog = () => setCategoryDialogVisible(false);

    // Обработка выбора категории
    const handleCategorySelect = (categoryId: number) => {
        setCategory(categoryId);
    };

    // Функции для работы с диалогом выбора тегов
    const showTagsSelectDialog = () => {
        setTagsSelectDialogVisible(true);
        // Обновляем список тегов при открытии диалога
        dispatch(fetchItemTags(tagSearchText));
    };

    const hideTagsSelectDialog = () => {
        setTagsSelectDialogVisible(false);
        setTagSearchText('');
    };

    // Отображение диалога для добавления нового тега
    const showTagDialog = () => {
        setTagDialogVisible(true);
        setTagError(null);
    };

    const hideTagDialog = () => {
        setTagDialogVisible(false);
        setNewTagName('');
        setTagError(null);
    };

    // Функция для добавления/удаления тега
    const toggleTag = (tagId: number) => {
        if (selectedTags.includes(tagId.toString())) {
            setSelectedTags(selectedTags.filter(id => id !== tagId.toString()));
        } else {
            setSelectedTags([...selectedTags, tagId.toString()]);
        }
    };

    // Функция для удаления тега из выбранных
    const removeTag = (tagId: number) => {
        setSelectedTags(selectedTags.filter(id => id !== tagId.toString()));
    };

    // Обработка поиска тегов
    const handleTagSearch = (text: string) => {
        setTagSearchText(text);
        if (text.trim()) {
            dispatch(fetchItemTags(text));
        } else {
            dispatch(fetchItemTags(undefined));
        }
    };

    // Обработка добавления нового тега
    const handleAddNewTag = async () => {
        if (newTagName.trim()) {
            try {
                // Проверка на дубликат тега
                const tagExists = tags.some(tag =>
                    tag.name.toLowerCase() === newTagName.trim().toLowerCase()
                );

                if (tagExists) {
                    setTagError('Тег с таким названием уже существует');
                    return;
                }

                // Создание нового тега через API
                const newTag = await dispatch(createTag(newTagName.trim())).unwrap();

                // Добавляем новый тег к выбранным тегам предмета
                setSelectedTags([...selectedTags, newTag.id.toString()]);

                // Обновляем поиск тегов, чтобы увидеть новый тег
                dispatch(fetchItemTags(tagSearchText));

                // Очищаем имя нового тега и закрываем диалог
                setNewTagName('');
                hideTagDialog();

            } catch (error: any) {
                console.error('Ошибка при создании нового тега:', error);
                setTagError(error.toString());
            }
        }
    };

    if (loading && (!conditions.length || !statuses.length || !tags.length || !userLocations.length)) {
        return <Loading fullscreen text="Загрузка данных..."/>;
    }

    const buttonLabel = isUploading
        ? `Создание...`
        : "Создать предмет";

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Создать новый предмет</Text>

            <BasicInfoSection
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
            />

            <CategorySection
                category={category}
                categories={categories}
                onCategoryPress={showCategoryDialog}
            />

            <ConditionSection
                condition={condition}
                setCondition={setCondition}
                conditions={conditions}
            />

            <PriceSection
                price={price}
                setPrice={setPrice}
            />

            <ItemTagsSection
                selectedTags={selectedTags}
                tags={tags}
                onOpenTagsDialog={showTagsSelectDialog}
                onRemoveTag={removeTag}
            />

            <ImagesSection
                images={images}
                onImagesSelected={handleImagesSelected}
            />

            <LocationSection
                location={location}
                locations={userLocations}
                onLocationPress={() => setLocationDialogVisible(true)}
            />

            <CustomButton
                mode="contained"
                label={buttonLabel}
                onPress={handleSaveItem}
                loading={loading || isUploading}
                disabled={loading || isUploading}
                style={styles.submitButton}
            />

            {/* Диалоги */}
            <CategorySelectDialog
                visible={categoryDialogVisible}
                onDismiss={hideCategoryDialog}
                categories={categories}
                onCategorySelect={handleCategorySelect}
            />

            <TagDialog
                visible={tagDialogVisible}
                onDismiss={hideTagDialog}
                newTagName={newTagName}
                setNewTagName={setNewTagName}
                onAddTag={handleAddNewTag}
                loading={loading && tagDialogVisible}
                error={tagError}
            />

            <TagsSelectDialog
                visible={tagsSelectDialogVisible}
                onDismiss={hideTagsSelectDialog}
                tags={tags}
                selectedTags={selectedTags}
                onToggleTag={toggleTag}
                onAddNewTagPress={showTagDialog}
                searchText={tagSearchText}
                onSearchTextChange={handleTagSearch}
                loading={loading && tagsSelectDialogVisible}
            />

            <LocationSelectDialog
                visible={locationDialogVisible}
                onDismiss={() => setLocationDialogVisible(false)}
                locations={userLocations}
                selectedLocation={location}
                onLocationSelect={setLocation}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    submitButton: {
        marginVertical: 16,
    },
});

export default CreateItemPage;