import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CustomInput } from '../common/CustomInput';
import { CustomButton } from '../common/CustomButton';
import { CustomPicker } from '../common/CustomPicker';
import { CustomTag } from '../common/CustomTag';
import ImagePickerComponent from '../common/ImagePickerComponent';
import { ItemStatus, ItemCondition } from '../../types/item';
import { CategoryShort } from '../../types/category';
import { Image } from 'react-native';

// Компонент информации о товаре
interface BasicInfoProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
}

export const BasicInfoSection: React.FC<BasicInfoProps> = ({
  title,
  setTitle,
  description,
  setDescription
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Основная информация</Text>
      
      <CustomInput
        label="Название"
        value={title}
        onChangeText={setTitle}
        placeholder="Введите название предмета"
        required
      />
      
      <CustomInput
        label="Описание"
        value={description}
        onChangeText={setDescription}
        placeholder="Введите описание предмета"
        multiline
        numberOfLines={4}
        required
      />
    </View>
  );
};

// Компонент категории
interface CategorySectionProps {
  category: number | null;
  categories: CategoryShort[];
  onCategoryPress: () => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  categories,
  onCategoryPress
}) => {
  const selectedCategory = categories.find(cat => cat.id === category);
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Категория</Text>
      
      <TouchableOpacity
        style={styles.selectButton}
        onPress={onCategoryPress}
      >
        <Text>
          {selectedCategory
            ? selectedCategory.name
            : 'Выберите категорию'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Компонент статуса и состояния
interface StatusConditionProps {
  status: ItemStatus | null;
  setStatus: (status: ItemStatus | null) => void;
  condition: ItemCondition | null;
  setCondition: (condition: ItemCondition | null) => void;
  statuses: ItemStatus[];
  conditions: ItemCondition[];
}

export const StatusConditionSection: React.FC<StatusConditionProps> = ({
  status,
  setStatus,
  condition,
  setCondition,
  statuses,
  conditions
}) => {
  const statusItems = statuses.map(status => ({
    label: status.name,
    value: status.id
  }));
  
  const conditionItems = conditions.map(condition => ({
    label: condition.name,
    value: condition.id
  }));
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Статус и состояние</Text>
      
      <CustomPicker
        label="Состояние"
        items={conditionItems}
        selectedValue={condition?.id || ''}
        onValueChange={(itemValue) => {
          const selected = conditions.find(c => c.id === itemValue);
          setCondition(selected || null);
        }}
        required
        placeholder="Выберите состояние"
      />
      
      <CustomPicker
        label="Статус"
        items={statusItems}
        selectedValue={status?.id || ''}
        onValueChange={(itemValue) => {
          const selected = statuses.find(s => s.id === itemValue);
          setStatus(selected || null);
        }}
        required
        placeholder="Выберите статус"
      />
    </View>
  );
};

// Компонент цены
interface PriceSectionProps {
  price: string;
  setPrice: (value: string) => void;
}

export const PriceSection: React.FC<PriceSectionProps> = ({
  price,
  setPrice
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Цена</Text>
      
      <CustomInput
        label="Цена (опционально)"
        value={price}
        onChangeText={(text: string) => setPrice(text.replace(/[^0-9.]/g, ''))}
        placeholder="Введите цену"
        keyboardType="numeric"
      />
    </View>
  );
};

// Компонент тегов
interface TagsSectionProps {
  selectedTags: string[];
  tags: Array<{id: number, name: string}>;
  onOpenTagsDialog: () => void;
  onRemoveTag: (tagId: number) => void;
}

export const TagsSection: React.FC<TagsSectionProps> = ({
  selectedTags,
  tags,
  onOpenTagsDialog,
  onRemoveTag
}) => {
  // Получаем объекты тегов по их ID
  const selectedTagObjects = selectedTags
    .map(tagId => tags.find(tag => tag.id.toString() === tagId))
    .filter(tag => tag !== undefined) as Array<{id: number, name: string}>;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Теги</Text>
      
      {selectedTagObjects.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          {selectedTagObjects.map(tag => (
            <CustomTag
              key={tag.id}
              label={tag.name}
              onPress={() => onRemoveTag(tag.id)}
              selected={true}
              style={styles.selectedTag}
            />
          ))}
        </View>
      )}
      
      <CustomButton
        mode="outlined"
        label="Добавить теги"
        onPress={onOpenTagsDialog}
        style={styles.addButton}
      />
    </View>
  );
};

// Компонент изображений
interface ImagesSectionProps {
  images: string[];
  existingImages?: string[];
  onImagesSelected: (images: string[]) => void;
}

export const ImagesSection: React.FC<ImagesSectionProps> = ({
  images,
  existingImages = [],
  onImagesSelected
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Изображения</Text>
      
      {existingImages.length > 0 && (
        <View>
          <Text style={styles.subsectionTitle}>Существующие изображения:</Text>
          <ScrollView horizontal={true} style={styles.existingImagesContainer}>
            {existingImages.map((imageUri, index) => (
              <View key={`existing-${index}`} style={styles.existingImageWrapper}>
                <Image 
                  source={{ uri: imageUri }} 
                  style={styles.existingImage} 
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      <Text style={styles.subsectionTitle}>
        {existingImages.length > 0 ? 'Добавить новые изображения:' : 'Выберите изображения:'}
      </Text>
      <ImagePickerComponent
        images={images}
        onImagesSelected={onImagesSelected}
      />
    </View>
  );
};

// Компонент состояния товара
interface ConditionSectionProps {
  condition: ItemCondition | null;
  setCondition: (condition: ItemCondition | null) => void;
  conditions: ItemCondition[];
}

export const ConditionSection: React.FC<ConditionSectionProps> = ({
  condition,
  setCondition,
  conditions
}) => {
  const conditionItems = conditions.map(condition => ({
    label: condition.name,
    value: condition.id
  }));
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Состояние товара</Text>
      
      <CustomPicker
        label="Состояние"
        items={conditionItems}
        selectedValue={condition?.id || ''}
        onValueChange={(itemValue) => {
          const selected = conditions.find(c => c.id === itemValue);
          setCondition(selected || null);
        }}
        required
        placeholder="Выберите состояние"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  selectButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  addButton: {
    marginTop: 8,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  selectedTag: {
    marginRight: 8,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  existingImagesContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  existingImageWrapper: {
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  existingImage: {
    width: 100,
    height: 100,
  },
}); 