import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { ProfileForm } from '../components/profile/ProfileForm';
import { fetchProfile, fetchLocations, fetchPrimaryLocation, fetchPreferences } from '../features/profile/profileThunks';
import { fetchMyItems } from '../features/items/itemsThunks';
import { ItemCard } from '../components/items/ItemCard';
import { useNavigation } from '@react-navigation/native';
import { ItemShort } from '../types/item';

export const ProfilePage: React.FC = React.memo(() => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const { profile, loading: profileLoading } = useAppSelector((state) => state.profile);
    const { loading: itemsLoading, myItems } = useAppSelector((state) => state.items);
    const { user } = useAppSelector((state) => state.auth);
    
    console.log('[ProfilePage] Render - user:', user ? `${user.username} (ID: ${user.id})` : 'null');
    console.log('[ProfilePage] profileLoading:', profileLoading, 'itemsLoading:', itemsLoading);
    console.log('[ProfilePage] profile:', !!profile, 'myItems count:', myItems.length);
    
    useEffect(() => {
        console.log('[ProfilePage] useEffect - user changed:', user?.id);
        
        // Загружаем данные только если есть пользователь
        if (user) {
            console.log('[ProfilePage] Loading user data...');
            
            // Загружаем данные профиля
            if (!profile && !profileLoading) {
                console.log('[ProfilePage] Fetching profile...');
                dispatch(fetchProfile());
                dispatch(fetchLocations());
                dispatch(fetchPrimaryLocation()).catch(() => {
                    // Игнорируем ошибку, если основного адреса нет
                    console.log('У пользователя нет основного адреса');
                });
                dispatch(fetchPreferences());
            }
            
            // Загружаем мои предметы
            console.log('[ProfilePage] Fetching my items...');
            dispatch(fetchMyItems());
        }
    }, [dispatch, user?.id]); // Зависимость от user.id, чтобы перезагружать при смене пользователя
    
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

    const keyExtractor = useCallback((item: ItemShort) => {
        return item.id ? item.id.toString() : Math.random().toString();
    }, []);

    const renderHeader = useCallback(() => (
        <View style={styles.header}>
            <Text style={styles.pageTitle}>Мой профиль</Text>
            <ProfileForm />
            <Text style={styles.sectionTitle}>Мои товары</Text>
        </View>
    ), []);

    const renderEmpty = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>У вас пока нет товаров</Text>
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
        console.log('[ProfilePage] Showing profile loading screen');
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976d2" />
            </View>
        );
    }

    console.log('[ProfilePage] Rendering main content with myItems:', myItems.length);
    
    return (
        <FlatList
            style={styles.container}
            data={myItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            columnWrapperStyle={myItems.length > 0 ? styles.row : undefined}
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