import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import {ItemShort} from '../../types/item';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ItemCardProps {
    item: ItemShort;
    onPress: (item: ItemShort) => void;
    horizontal?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
                                                      item,
                                                      onPress,
                                                      horizontal = false
                                                  }) => {
    // Форматировать цену, если она есть
    const formattedPrice = item.estimated_value
        ? `${item.estimated_value} ₽`
        : 'Цена не указана';

    console.log(item.tags)

    return (
        <TouchableOpacity
            style={[
                styles.container,
                horizontal ? styles.horizontalContainer : styles.verticalContainer
            ]}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {item.primary_image ? (
                    <Image
                        source={{uri: item.primary_image}}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.noImageContainer}>
                        <Icon name="image" size={40} color="#cccccc"/>
                    </View>
                )}

                {/* Метка состояния товара (перемещена на изображение) */}
                {item.condition_name && (
                    <View style={styles.conditionBadge}>
                        <Text style={styles.conditionBadgeText}>{item.condition_name}</Text>
                    </View>
                )}

                {/* Метка избранного */}
                {item.is_favorited && (
                    <View style={styles.favoriteIcon}>
                        <Icon name="favorite" size={16} color="#e91e63"/>
                    </View>
                )}
            </View>

            <View style={[styles.infoContainer, horizontal && styles.infoContainerHorizontal]}>
                <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>

                <Text style={styles.price}>{formattedPrice}</Text>

                {/* Если нам нужно показать владельца */}
                {item.owner_details && (
                    <View style={styles.ownerContainer}>
                        <View style={styles.ownerAvatarContainer}>
                            {item.owner_details.avatar_url ? (
                                <Image 
                                    source={{ uri: item.owner_details.avatar_url }} 
                                    style={styles.ownerAvatar}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.ownerAvatarPlaceholder}>
                                    <Icon name="person" size={10} color="#666" />
                                </View>
                            )}
                        </View>
                        <Text style={styles.owner} numberOfLines={1} ellipsizeMode="tail">
                            {item.owner_details.full_name || item.owner_details.username}
                        </Text>
                        {item.owner_details.rating !== undefined && item.owner_details.rating !== null && (
                            <View style={styles.ownerRating}>
                                <Icon name="star" size={8} color="#FFD700" />
                                <Text style={styles.ownerRatingText}>
                                    {parseFloat(item.owner_details.rating.toString()).toFixed(1)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Отображение адреса */}
                {item.location_details && (
                    <View style={styles.locationContainer}>
                        <Icon name="location-on" size={12} color="#666" />
                        <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                            {item.location_details.city}
                        </Text>
                    </View>
                )}

                {/* Показываем несколько тегов, если они есть */}
                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {item.tags.slice(0, 2).map((tag) => (
                            <View key={typeof tag === 'object' ? tag.id : tag} style={styles.tag}>
                                <Text style={styles.tagText}>
                                    {typeof tag === 'object' ? tag.name : `Тег ${tag}`}
                                </Text>
                            </View>
                        ))}
                        {item.tags.length > 2 && (
                            <Text style={styles.moreTags}>+{item.tags.length - 2}</Text>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const {width} = Dimensions.get('window');
const cardWidth = width * 0.44;

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        margin: 8,
    },
    verticalContainer: {
        width: cardWidth, // Динамическая ширина, зависящая от ширины экрана
    },
    horizontalContainer: {
        flexDirection: 'row',
        width: '95%',
        height: 150, // Фиксированная высота для горизонтального режима
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 140,
        backgroundColor: '#f0f0f0',
    },
    noImageContainer: {
        width: '100%',
        height: 140,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    favoriteIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 12,
        padding: 4,
        elevation: 2,
    },
    conditionBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(33, 150, 243, 0.85)',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    conditionBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    infoContainer: {
        padding: 12,
    },
    infoContainerHorizontal: {
        width: '60%',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        lineHeight: 20,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 8,
    },
    ownerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ownerAvatarContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 8,
    },
    ownerAvatar: {
        width: '100%',
        height: '100%',
    },
    ownerAvatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    owner: {
        fontSize: 12,
        color: '#666',
    },
    ownerRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    ownerRatingText: {
        fontSize: 10,
        color: '#666',
        marginLeft: 2,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: '#e3f2fd',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 6,
        marginBottom: 6,
    },
    tagText: {
        fontSize: 10,
        color: '#1976d2',
    },
    moreTags: {
        fontSize: 10,
        color: '#666',
        alignSelf: 'center',
        marginLeft: 4,
    },
}); 