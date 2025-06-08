import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, ActivityIndicator, Dimensions, Image } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserItems } from '../features/items/itemsThunks';
import { fetchPublicProfile } from '../features/profile/profileThunks';
import { ItemCard } from '../components/items/ItemCard';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ItemShort } from '../types/item';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface UserProfileParams {
    userId: number;
}

export const UserProfilePage: React.FC = React.memo(() => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { userId } = route.params as UserProfileParams;
    
    const { loading: itemsLoading, userItems } = useAppSelector((state) => state.items);
    const { publicProfile, loading: profileLoading } = useAppSelector((state) => state.profile);
    
    useEffect(() => {
        // Загружаем публичный профиль пользователя
        dispatch(fetchPublicProfile(userId));
        
        // Загружаем предметы пользователя
        dispatch(fetchUserItems(userId));
    }, [dispatch, userId]);
    
    const handleItemPress = useCallback((item: ItemShort) => {
        navigation.navigate('ItemDetail', { itemId: item.id });
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: ItemShort }) => (
        <View style={styles.itemContainer}>
            <ItemCard
                item={item}
                onPress={handleItemPress}
            />
        </View>
    ), [handleItemPress]);

    const keyExtractor = useCallback((item: ItemShort) => item.id.toString(), []);

    const renderHeader = useCallback(() => (
        <View style={styles.header}>
            <Text style={styles.pageTitle}>Профиль пользователя</Text>
            
            {publicProfile && (
                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        {publicProfile.avatar_url ? (
                            <Image 
                                source={{ uri: publicProfile.avatar_url }} 
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Icon name="person" size={40} color="#666" />
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.userInfo}>
                        <Text style={styles.username}>
                            {publicProfile.full_name || publicProfile.username}
                        </Text>
                        
                        {publicProfile.bio && (
                            <Text style={styles.bio}>{publicProfile.bio}</Text>
                        )}
                        
                        <View style={styles.statsContainer}>
                            {publicProfile.rating !== undefined && publicProfile.rating !== null && (
                                <View style={styles.statItem}>
                                    <Icon name="star" size={16} color="#FFD700" />
                                    <Text style={styles.statText}>
                                        {parseFloat(publicProfile.rating.toString()).toFixed(1)}
                                    </Text>
                                </View>
                            )}
                            
                            {publicProfile.successful_trades !== undefined && (
                                <View style={styles.statItem}>
                                    <Icon name="swap-horiz" size={16} color="#4CAF50" />
                                    <Text style={styles.statText}>
                                        {publicProfile.successful_trades} обменов
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            )}
            
            <Text style={styles.sectionTitle}>Товары пользователя</Text>
        </View>
    ), [publicProfile]);

    const renderEmpty = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>У пользователя пока нет товаров</Text>
        </View>
    ), []);

    const renderFooter = useCallback(() => {
        if (itemsLoading) {
            return (
                <View style={styles.itemsLoading}>
                    <ActivityIndicator size="large" color="#1976d2" />
                </View>
            );
        }
        return null;
    }, [itemsLoading]);
    
    if (profileLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976d2" />
            </View>
        );
    }

    return (
        <FlatList
            style={styles.container}
            data={userItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            columnWrapperStyle={userItems.length > 0 ? styles.row : undefined}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.listContainer}
        />
    );
});

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContainer: {
        paddingBottom: 20,
    },
    header: {
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 16,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    bio: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    statText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 16,
    },
    itemsLoading: {
        padding: 20,
        alignItems: 'center',
    },
    row: {
        justifyContent: 'space-around',
        paddingHorizontal: 8,
    },
    itemContainer: {
        width: '48%',
        marginBottom: 10,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyMessage: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        marginTop: 20,
        marginBottom: 20,
    },
}); 