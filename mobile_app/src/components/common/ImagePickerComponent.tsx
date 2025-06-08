import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerComponentProps {
  images: string[];
  onImagesSelected: (images: string[]) => void;
  maxImages?: number;
}

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({ 
  images, 
  onImagesSelected,
  maxImages = 5
}) => {
  // Открывает галерею для выбора изображения
  const pickImage = async () => {
    // Проверяем разрешения
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Извините, нам нужно разрешение на доступ к вашей галерее изображений!');
      return;
    }

    if (images.length >= maxImages) {
      Alert.alert('Лимит изображений', `Вы можете загрузить максимум ${maxImages} изображений`);
      return;
    }

    // Открываем медиатеку
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = [...images, result.assets[0].uri];
      onImagesSelected(newImages);
    }
  };

  // Открывает камеру для создания фото
  const takePhoto = async () => {
    // Проверяем разрешения
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Извините, нам нужно разрешение на доступ к вашей камере!');
      return;
    }

    if (images.length >= maxImages) {
      Alert.alert('Лимит изображений', `Вы можете загрузить максимум ${maxImages} изображений`);
      return;
    }

    // Открываем камеру
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = [...images, result.assets[0].uri];
      onImagesSelected(newImages);
    }
  };

  // Удаляет изображение
  const removeImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    onImagesSelected(updatedImages);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Ionicons name="images-outline" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Выбрать из галереи</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Ionicons name="camera-outline" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Сделать фото</Text>
        </TouchableOpacity>
      </View>
      
      {images.length > 0 ? (
        <ScrollView horizontal style={styles.imageScrollView}>
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Изображения не выбраны</Text>
        </View>
      )}
      
      <Text style={styles.helperText}>
        {images.length}/{maxImages} изображений - нажмите на изображение, чтобы удалить
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '500',
  },
  imageScrollView: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  imageContainer: {
    marginRight: 10,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  placeholderContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  placeholderText: {
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default ImagePickerComponent; 