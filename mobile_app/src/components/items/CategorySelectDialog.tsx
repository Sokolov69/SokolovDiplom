import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { CustomDialog, DialogContent, DialogActions, DialogButton } from '../common/CustomDialog';
import { CustomInput } from '../common/CustomInput';
import { CategoryShort } from '../../types/category';

interface CategorySelectDialogProps {
  visible: boolean;
  onDismiss: () => void;
  categories: CategoryShort[];
  onCategorySelect: (categoryId: number) => void;
}

export const CategorySelectDialog: React.FC<CategorySelectDialogProps> = ({
  visible,
  onDismiss,
  categories,
  onCategorySelect
}) => {
  const [searchText, setSearchText] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<CategoryShort[]>(categories);
  
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((cat: CategoryShort) => 
        cat.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchText, categories]);
  
  const handleSelect = (categoryId: number) => {
    onCategorySelect(categoryId);
    onDismiss();
  };
  
  return (
    <CustomDialog
      visible={visible}
      title="Выберите категорию"
      onDismiss={onDismiss}
      actions={
        <DialogActions>
          <DialogButton 
            label="Отмена" 
            onPress={onDismiss} 
          />
        </DialogActions>
      }
    >
      <DialogContent>
        <CustomInput
          label="Поиск категорий"
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Введите название категории"
        />
        
        <ScrollView style={styles.dialogScrollView}>
          {filteredCategories.map((cat) => (
            <TouchableOpacity 
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => handleSelect(cat.id)}
            >
              <Text>{cat.name}</Text>
            </TouchableOpacity>
          ))}
          {filteredCategories.length === 0 && (
            <Text style={styles.emptyText}>Категории не найдены</Text>
          )}
        </ScrollView>
      </DialogContent>
    </CustomDialog>
  );
};

const styles = StyleSheet.create({
  dialogScrollView: {
    maxHeight: 300,
    marginTop: 10,
  },
  categoryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emptyText: {
    padding: 12,
    color: '#999',
    textAlign: 'center',
  },
}); 