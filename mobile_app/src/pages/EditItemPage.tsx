import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ItemCondition, UpdateItemData } from '../types/item';
import { 
  updateItemWithImages, 
  fetchItemById,
  fetchItemConditions, 
  fetchItemStatuses, 
  fetchItemTags,
  fetchUserLocations,
  createTag 
} from '../features/items/itemsThunks';
import { fetchCategories } from '../features/categories/categoriesThunks';
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import { CustomButton } from '../components/common/CustomButton';
import { 
  BasicInfoSection,
  CategorySection,
  ConditionSection,
  PriceSection,
  ImagesSection
} from '../components/items/ItemFormComponents';
import ItemTagsSection from '../components/items/ItemTagsSection';
import LocationSection from '../components/items/LocationSection';
import { CategorySelectDialog } from '../components/items/CategorySelectDialog';
import { TagDialog } from '../components/items/TagDialog';
import { TagsSelectDialog } from '../components/items/TagsSelectDialog';
import LocationSelectDialog from '../components/items/LocationSelectDialog';

interface EditItemParams {
  itemId: number;
}

const EditItemPage = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { itemId } = route.params as EditItemParams;
  
  const { currentItem, conditions, statuses, tags, userLocations, loading, error } = useAppSelector((state) => state.items);
  const { items: categories } = useAppSelector((state) => state.categories);

  // Состояния формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [location, setLocation] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  // Состояние для отслеживания загрузки 
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          dispatch(fetchItemById(itemId)),
          dispatch(fetchItemConditions()),
          dispatch(fetchItemStatuses()),
          dispatch(fetchItemTags()),
          dispatch(fetchUserLocations()),
          dispatch(fetchCategories({is_active: true}))
        ]);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        console.error('Ошибка при загрузке данных:', err);
      }
    };
    
    loadData();
  }, [dispatch, itemId]);
  
  // Заполнение формы данными текущего товара после его загрузки
  useEffect(() => {
    if (currentItem && !isLoading) {
      setTitle(currentItem.title || '');
      setDescription(currentItem.description || '');
      setCategory(currentItem.category || null);
      setLocation(currentItem.location || null);
      
      // Получаем полный объект состояния из списка состояний
      if (currentItem.condition && conditions.length) {
        const itemCondition = conditions.find(c => c.id === currentItem.condition);
        if (itemCondition) {
          setCondition(itemCondition);
        }
      }
      
      setPrice(currentItem.estimated_value ? currentItem.estimated_value.toString() : '');
      
      // Устанавливаем теги
      if (currentItem.tags && currentItem.tags.length) {
        setSelectedTags(currentItem.tags.map(tag => tag.id.toString()));
      }
      
      // Устанавливаем существующие изображения
      if (currentItem.images && currentItem.images.length) {
        const imageUrls = currentItem.images.map(img => img.image);
        setExistingImages(imageUrls);
      } else if (currentItem.primary_image) {
        setExistingImages([currentItem.primary_image]);
      }
    }
  }, [currentItem, conditions, isLoading]);
  
  // Обработка сохранения изменений предмета
  const handleUpdateItem = async () => {
    if (!title || !description || !category || !condition) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    try {
      const itemData: UpdateItemData = {
        id: itemId,
        title,
        description,
        category: category!,
        condition: condition!.id,
        location: location,
        estimated_value: price ? parseFloat(price) : undefined,
        tags: selectedTags
      };
      
      console.log('Обновление предмета с данными:', JSON.stringify(itemData));
      console.log('Выбранные новые изображения:', images.length);
      console.log('Существующие изображения:', existingImages.length);
      
      // Устанавливаем состояние загрузки
      setIsUploading(true);
      
      // Обновляем предмет с изображениями в одном запросе
      const updatedItem = await dispatch(updateItemWithImages({ 
        itemId,
        itemData, 
        newImages: images,
        existingImages 
      })).unwrap();
      
      console.log('Предмет успешно обновлен:', JSON.stringify(updatedItem));
      
      setIsUploading(false);
      
      Alert.alert('Успех', 'Предмет успешно обновлен', [
        { text: 'OK', onPress: () => {
          navigation.navigate('ItemDetail', { itemId });
        }}
      ]);
    } catch (err: any) {
      setIsUploading(false);
      console.error('Ошибка при обновлении предмета:', err);
      const errorMessage = err.message || 'Не удалось обновить предмет. Пожалуйста, попробуйте снова.';
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
  
  if (isLoading || (loading && (!conditions.length || !statuses.length || !tags.length || !userLocations.length))) {
    return <Loading fullscreen text="Загрузка данных..." />;
  }
  
  if (error) {
    return <Error message={error} onRetry={() => dispatch(fetchItemById(itemId))} fullscreen />;
  }
  
  if (!currentItem) {
    return <Error message="Товар не найден" fullscreen />;
  }
  
  const buttonLabel = isUploading
    ? `Сохранение...`
    : "Сохранить изменения";
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Редактирование предмета</Text>
      
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
      
      <LocationSection
        location={location}
        locations={userLocations}
        onLocationPress={() => setLocationDialogVisible(true)}
      />
      
      <ImagesSection 
        images={images}
        existingImages={existingImages}
        onImagesSelected={handleImagesSelected}
      />
      
      <View style={styles.buttonsContainer}>
        <CustomButton 
          mode="contained" 
          label={buttonLabel}
          onPress={handleUpdateItem}
          loading={loading || isUploading}
          disabled={loading || isUploading}
          style={styles.submitButton}
        />
        
        <CustomButton 
          mode="outlined" 
          label="Отмена"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        />
      </View>
      
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
  buttonsContainer: {
    marginVertical: 16,
  },
  submitButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 8,
  },
});

export default EditItemPage; 