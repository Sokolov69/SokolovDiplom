import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Dimensions 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchItemById, toggleFavorite } from '../features/items/itemsThunks';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CustomButton } from '../components/common/CustomButton';
import { CustomTag } from '../components/common/CustomTag';
import UserChatModal from '../components/chat/UserChatModal';

interface ItemDetailParams {
  itemId: number;
}

const ItemDetailPage = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { itemId } = route.params as ItemDetailParams;
  
  const { currentItem, loading, error } = useAppSelector((state) => state.items);
  const { user } = useAppSelector((state) => state.auth);
  
  // Состояние для обработки избранного
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  
  // Состояние для галереи изображений
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Состояние для чата с владельцем
  const [showOwnerChat, setShowOwnerChat] = useState(false);
  
  useEffect(() => {
    if (itemId) {
      dispatch(fetchItemById(itemId));
      setCurrentImageIndex(0); // Сбрасываем индекс изображения при смене предмета
    }
  }, [itemId, dispatch]);
  
  // Добавим логирование для отладки
  useEffect(() => {
    if (currentItem) {
      console.log('ItemDetailPage: currentItem:', currentItem);
      console.log('ItemDetailPage: primary_image:', currentItem.primary_image);
      console.log('ItemDetailPage: images:', currentItem.images);
      console.log('ItemDetailPage: allImages:', getAllImages());
      console.log('ItemDetailPage: owner_details:', currentItem.owner_details);
      if (currentItem.owner_details) {
        console.log('ItemDetailPage: rating:', currentItem.owner_details.rating);
        console.log('ItemDetailPage: avatar_url:', currentItem.owner_details.avatar_url);
      }
    }
  }, [currentItem]);
  
  const handleGoBack = () => {
    navigation.goBack();
  };
  
  const handleToggleFavorite = async () => {
    if (!currentItem) return;
    
    setIsFavoriteLoading(true);
    try {
      await dispatch(toggleFavorite(currentItem.id)).unwrap();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить/удалить из избранного');
    } finally {
      setIsFavoriteLoading(false);
    }
  };
  
  // Проверяем, является ли пользователь владельцем предмета
  const isOwner = user && currentItem?.owner === user.id;
  
  // Получаем все изображения предмета
  const getAllImages = () => {
    if (!currentItem) return [];
    
    const images = [];
    
    // Добавляем primary_image если есть
    if (currentItem.primary_image) {
      images.push({
        id: 'primary',
        image_url: currentItem.primary_image,
        is_primary: true
      });
    }
    
    // Добавляем остальные изображения, исключая primary если оно уже добавлено
    if (currentItem.images && currentItem.images.length > 0) {
      const additionalImages = currentItem.images.filter(img => 
        !currentItem.primary_image || img.image_url !== currentItem.primary_image
      );
      images.push(...additionalImages.map(img => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: img.is_primary
      })));
    }
    
    return images;
  };
  
  const allImages = getAllImages();
  
  const handleContactOwner = () => {
    if (!currentItem?.owner_details || !user) return;
    
    // Открываем чат с владельцем
    setShowOwnerChat(true);
  };
  
  if (loading && !currentItem) {
    return <Loading fullscreen text="Загрузка информации о товаре..." />;
  }
  
  if (error) {
    return <Error message={error} onRetry={() => dispatch(fetchItemById(itemId))} fullscreen />;
  }
  
  if (!currentItem) {
    return <Error message="Товар не найден" fullscreen />;
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Верхняя панель с кнопками */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Показываем кнопку избранного только для чужих товаров */}
        {!isOwner && (
          <TouchableOpacity 
            onPress={handleToggleFavorite} 
            style={styles.favoriteButton}
          >
            {isFavoriteLoading ? (
              <ActivityIndicator size="small" color="#e91e63" />
            ) : (
              <Icon 
                name={!!currentItem.is_favorited ? "favorite" : "favorite-outline"} 
                size={24} 
                color="#e91e63" 
              />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Галерея изображений */}
      <View style={styles.imageContainer}>
        {allImages.length > 0 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                setCurrentImageIndex(index);
              }}
              style={styles.imageScrollView}
            >
              {allImages.map((image, index) => (
                <Image
                  key={image.id}
                  source={{ uri: image.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log(`Ошибка загрузки изображения ${index}:`, error.nativeEvent.error);
                    console.log('URL изображения:', image.image_url);
                  }}
                  onLoad={() => {
                    console.log(`Изображение ${index} успешно загружено:`, image.image_url);
                  }}
                />
              ))}
            </ScrollView>
            
            {/* Индикаторы страниц */}
            {allImages.length > 1 && (
              <View style={styles.pageIndicatorContainer}>
                {allImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.pageIndicator,
                      index === currentImageIndex && styles.activePageIndicator
                    ]}
                  />
                ))}
              </View>
            )}
            
            {/* Счетчик изображений */}
            {allImages.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {allImages.length}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noImageContainer}>
            <Icon name="image" size={80} color="#cccccc" />
            <Text style={styles.noImageText}>Нет изображения</Text>
          </View>
        )}
      </View>
      
      {/* Информация о товаре */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{currentItem.title}</Text>
        
        <View style={styles.priceRow}>
          {currentItem.estimated_value && (
            <Text style={styles.price}>
              {currentItem.estimated_value} ₽
            </Text>
          )}
          
          <View style={styles.statusConditionContainer}>
            {currentItem.status_details && (
              <View style={styles.statusChip}>
                <Text style={styles.statusText}>{currentItem.status_details.name}</Text>
              </View>
            )}
            
            {currentItem.condition_details && (
              <View style={styles.conditionChip}>
                <Text style={styles.conditionText}>{currentItem.condition_details.name}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Информация о владельце */}
        {currentItem.owner_details && (
          <TouchableOpacity 
            style={styles.ownerContainer}
            onPress={() => navigation.navigate('UserProfile', { userId: currentItem.owner })}
          >
            <View style={styles.ownerAvatarContainer}>
              {currentItem.owner_details.avatar_url ? (
                <Image 
                  source={{ uri: currentItem.owner_details.avatar_url }} 
                  style={styles.ownerAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.ownerAvatarPlaceholder}>
                  <Icon name="person" size={16} color="#666" />
                </View>
              )}
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerText}>
                {currentItem.owner_details.full_name || currentItem.owner_details.username}
              </Text>
              {currentItem.owner_details.rating !== undefined && currentItem.owner_details.rating !== null && (
                <View style={styles.ownerRating}>
                  <Icon name="star" size={12} color="#FFD700" />
                  <Text style={styles.ownerRatingText}>
                    {parseFloat(currentItem.owner_details.rating.toString()).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        )}
        
        {/* Описание */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>{currentItem.description}</Text>
        </View>
        
        {/* Категория */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Категория</Text>
          <TouchableOpacity 
            style={styles.categoryContainer}
            onPress={() => navigation.navigate('CategoryDetail', { categoryId: currentItem.category })}
          >
            <Icon name="category" size={20} color="#1976d2" />
            <Text style={styles.categoryText}>
              {currentItem.category_details?.name}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Адрес */}
        {currentItem.location_details && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Адрес для встречи</Text>
            <View style={styles.locationContainer}>
              <Icon name="location-on" size={20} color="#4CAF50" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>{currentItem.location_details.title}</Text>
                <Text style={styles.locationAddress}>
                  {currentItem.location_details.city}, {currentItem.location_details.address}
                </Text>
                {currentItem.location_details.region && (
                  <Text style={styles.locationRegion}>{currentItem.location_details.region}</Text>
                )}
              </View>
            </View>
          </View>
        )}
        
        {/* Теги */}
        {currentItem.tags && currentItem.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Теги</Text>
            <View style={styles.tagsContainer}>
              {currentItem.tags.map((tag) => (
                <CustomTag 
                  key={tag.id}
                  label={tag.name}
                  onPress={() => {}}
                  style={styles.tag}
                />
              ))}
            </View>
          </View>
        )}
        
        {/* Статистика */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="visibility" size={16} color="#666" />
            <Text style={styles.statText}>{currentItem.views_count || 0} просмотров</Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="favorite" size={16} color="#666" />
            <Text style={styles.statText}>{currentItem.favorites_count || 0} в избранном</Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="access-time" size={16} color="#666" />
            <Text style={styles.statText}>
              {new Date(currentItem.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        {/* Действия */}
        {!isOwner && (
          <View style={styles.actionsContainer}>
            <CustomButton 
              mode="contained"
              label="Предложить обмен"
              onPress={() => {
                navigation.navigate('CreateTrade', { receiverId: currentItem.owner, receiverItemId: currentItem.id });
              }}
              style={styles.tradeButton}
            />
            <CustomButton 
              mode="outlined"
              label="Связаться с владельцем"
              onPress={handleContactOwner}
              style={styles.contactButton}
            />
          </View>
        )}
        
        {isOwner && (
          <View style={styles.actionsContainer}>
            <CustomButton 
              mode="outlined"
              label="Редактировать"
              onPress={() => {
                navigation.navigate('EditItem', { itemId: currentItem.id });
              }}
              style={styles.editButton}
            />
          </View>
        )}
      </View>

      {/* Модальное окно чата с владельцем */}
      {showOwnerChat && currentItem?.owner_details && user && (
        <UserChatModal
          visible={showOwnerChat}
          onClose={() => setShowOwnerChat(false)}
          otherUser={currentItem.owner_details}
          currentUser={user}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  imageScrollView: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: Dimensions.get('window').width,
    height: 300,
  },
  pageIndicatorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activePageIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 8,
    color: '#999',
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statusConditionContainer: {
    flexDirection: 'row',
  },
  statusChip: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#1976d2',
  },
  conditionChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  conditionText: {
    fontSize: 12,
    color: '#666',
  },
  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ownerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  ownerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  ownerText: {
    fontSize: 14,
    color: '#333',
  },
  ownerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ownerRatingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionsContainer: {
    marginTop: 16,
  },
  tradeButton: {
    marginBottom: 8,
  },
  contactButton: {
    marginBottom: 8,
  },
  editButton: {
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    marginLeft: 8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
  },
  locationRegion: {
    fontSize: 12,
    color: '#666',
  },
});

export default ItemDetailPage; 