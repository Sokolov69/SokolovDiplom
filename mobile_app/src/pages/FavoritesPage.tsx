import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites } from '../features/items/itemsThunks';
import { ItemCard } from '../components/items/ItemCard';
import { useNavigation } from '@react-navigation/native';
import { ItemShort } from '../types/item';

export const FavoritesPage: React.FC = React.memo(() => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const { loading, favorites } = useAppSelector((state) => state.items);
    const { user } = useAppSelector((state) => state.auth);
    
    useEffect(() => {
        // Загружаем избранные предметы при монтировании компонента
        if (user && !loading) {
            dispatch(fetchFavorites());
        }
    }, [dispatch, user, favorites.length]);
    
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
            <Text style={styles.pageTitle}>Избранное</Text>
            <Text style={styles.subTitle}>Ваши избранные предметы</Text>
        </View>
    ), []);

    const renderEmpty = useCallback(() => (
        <View style={styles.messageContainer}>
            <Text style={styles.emptyMessage}>У вас пока нет избранных предметов</Text>
            <Text style={styles.emptySubMessage}>
                Добавляйте интересные предметы в избранное, нажимая на иконку сердечка
            </Text>
        </View>
    ), []);

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.pageTitle}>Избранное</Text>
                <View style={styles.messageContainer}>
                    <Text style={styles.authMessage}>
                        Для просмотра избранных предметов необходимо авторизоваться
                    </Text>
                </View>
            </View>
        );
    }

    if (loading && favorites.length === 0) {
        return (
            <View style={styles.container}>
                {renderHeader()}
                <View style={styles.itemsLoading}>
                    <ActivityIndicator size="large" color="#1976d2" />
                </View>
            </View>
        );
    }

    return (
        <FlatList
            style={styles.container}
            data={favorites}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            columnWrapperStyle={styles.row}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
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
        paddingBottom: 10,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 16,
    },
    subTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
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
    messageContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    emptyMessage: {
        textAlign: 'center',
        color: '#666',
        fontSize: 18,
        marginTop: 20,
        fontWeight: '600',
    },
    emptySubMessage: {
        textAlign: 'center',
        color: '#888',
        fontSize: 14,
        marginTop: 10,
        paddingHorizontal: 20,
    },
    authMessage: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        marginTop: 20,
        marginBottom: 20,
    },
}); 