import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategoryById, fetchCategoryChildren } from '../../features/categories/categoriesThunks';
import { fetchItems } from '../../features/items/itemsThunks';
import { Loading } from '../common/Loading';
import { Error } from '../common/Error';
import { Category, CategoryShort } from '../../types/category';
import { ItemShort } from '../../types/item';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CategoryCard } from './CategoryCard';
import { ItemCard } from '../items/ItemCard';

interface CategoryDetailProps {
    categoryId: number;
}

// Создаем тип для объединения элементов списка
type ListItemType = CategoryShort | ItemShort;

export const CategoryDetail: React.FC<CategoryDetailProps> = ({ categoryId }) => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const { currentCategory, childCategories, loading: categoryLoading, error: categoryError } = useAppSelector((state) => state.categories);
    const { items, loading: itemsLoading, error: itemsError } = useAppSelector((state) => state.items);
    
    const [refreshing, setRefreshing] = useState(false);
    const [showingSection, setShowingSection] = useState<'subcategories' | 'items'>('subcategories');
    const [isLoaded, setIsLoaded] = useState(false);

    // Используем мемоизированный loadCategory для предотвращения лишних рендеров
    const loadCategory = useCallback(async (id: number, forceReload = false) => {
        if (!id || (isLoaded && !forceReload)) {
            console.log('[CategoryDetail] Пропускаем загрузку - уже загружено или нет ID');
            return;
        }

        try {
            console.log('[CategoryDetail] Загрузка категории:', id);
            
            // Загружаем категорию и дочерние категории последовательно
            await dispatch(fetchCategoryById(id));
            await dispatch(fetchCategoryChildren(id));
            
            // Загружаем товары только если показываем товары или это первая загрузка
            if (showingSection === 'items' || !isLoaded) {
                await dispatch(fetchItems({ category: id }));
            }
            
            setIsLoaded(true);
            
            console.log('[CategoryDetail] Данные загружены для ID:', id);
        } catch (error: any) {
            console.error('[CategoryDetail] Error:', error);
        }
    }, [dispatch, isLoaded, showingSection]);
    
    // Загружаем данные только при изменении categoryId
    useEffect(() => {
        console.log('[CategoryDetail] useEffect для categoryId:', categoryId);
        setIsLoaded(false);
        loadCategory(categoryId, true);
    }, [categoryId]); // Убираем loadCategory из зависимостей
    
    // Загружаем товары при переключении на вкладку товаров
    useEffect(() => {
        if (isLoaded && categoryId) {
            console.log('[CategoryDetail] Загрузка товаров для категории:', categoryId);
            dispatch(fetchItems({ category: categoryId }));
        }
    }, [showingSection, isLoaded, categoryId, dispatch]);
    
    // Используем дочерние категории из объекта текущей категории, если childCategories пуст
    const displayChildCategories = childCategories.length > 0 
        ? childCategories 
        : (currentCategory?.children || []);
    
    // Фильтруем товары по текущей категории
    const categoryItems = items;
    
    // Получаем отображаемые элементы в зависимости от выбранной секции
    const getDisplayItems = (): ListItemType[] => {
        return showingSection === 'subcategories' 
            ? displayChildCategories
            : categoryItems;
    };
    
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadCategory(categoryId, true);
        setRefreshing(false);
    };
    
    const handleChildCategoryPress = (category: CategoryShort) => {
        navigation.navigate('CategoryDetail', { categoryId: category.id });
    };
    
    const handleParentCategoryPress = () => {
        if (currentCategory?.parent) {
            navigation.navigate('CategoryDetail', { categoryId: currentCategory.parent });
        }
    };
    
    const handleItemPress = (item: ItemShort) => {
        navigation.navigate('ItemDetail', { itemId: item.id });
    };
    
    const toggleSection = (section: 'subcategories' | 'items') => {
        setShowingSection(section);
    };
    
    const isLoading = (categoryLoading || itemsLoading) && !refreshing;
    const error = categoryError || itemsError;
    
    // Функция для рендеринга элемента списка
    const renderItem = ({ item }: { item: ListItemType }) => {
        // Проверяем, является ли элемент категорией или товаром
        if ('slug' in item && 'name' in item) {
            // Это категория
            return (
                <CategoryCard
                    key={item.id}
                    category={item as CategoryShort}
                    onPress={handleChildCategoryPress}
                    tileMode={true}
                    showChildren={false}
                />
            );
        } else {
            // Это товар
            return (
                <ItemCard
                    key={item.id}
                    item={item as ItemShort}
                    onPress={handleItemPress}
                />
            );
        }
    };

    // Рендер элемента заголовка
    const renderHeader = () => (
        <>
            {/* Родительская категория */}
            {currentCategory?.parent_details && (
                <TouchableOpacity 
                    style={styles.parentContainer}
                    onPress={handleParentCategoryPress}
                >
                    <Icon name="arrow-back" size={20} color="#1976d2" />
                    <Text style={styles.parentText}>
                        {currentCategory.parent_details.name}
                    </Text>
                </TouchableOpacity>
            )}
            
            {/* Основная информация */}
            <View style={styles.headerContainer}>
                {currentCategory?.icon ? (
                    <Image 
                        source={{ uri: currentCategory.icon }} 
                        style={styles.icon} 
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.iconPlaceholder}>
                        <Icon name="category" size={40} color="#1976d2" />
                    </View>
                )}
                
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>{currentCategory?.name}</Text>
                </View>
            </View>
            
            {/* Описание категории */}
            {currentCategory?.description && (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionText}>{currentCategory.description}</Text>
                </View>
            )}
            
            {/* Переключатель между подкатегориями и товарами */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[
                        styles.tab, 
                        showingSection === 'subcategories' && styles.activeTab
                    ]}
                    onPress={() => toggleSection('subcategories')}
                >
                    <Text 
                        style={[
                            styles.tabText, 
                            showingSection === 'subcategories' && styles.activeTabText
                        ]}
                    >
                        Подкатегории {displayChildCategories.length > 0 && `(${displayChildCategories.length})`}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[
                        styles.tab, 
                        showingSection === 'items' && styles.activeTab
                    ]}
                    onPress={() => toggleSection('items')}
                >
                    <Text 
                        style={[
                            styles.tabText, 
                            showingSection === 'items' && styles.activeTabText
                        ]}
                    >
                        Товары {categoryItems.length > 0 && `(${categoryItems.length})`}
                    </Text>
                </TouchableOpacity>
            </View>
        </>
    );

    // Рендер пустого списка
    const renderEmptyList = () => {
        if (showingSection === 'subcategories') {
            return <Text style={styles.emptyText}>Нет подкатегорий</Text>;
        } else {
            return <Text style={styles.emptyText}>Нет товаров в этой категории</Text>;
        }
    };
    
    if (isLoading && !currentCategory) {
        return <Loading text="Загрузка категории..." fullscreen />;
    }
    
    if (error) {
        return <Error 
            message={error} 
            onRetry={() => loadCategory(categoryId, true)} 
            fullscreen
        />;
    }
    
    if (!currentCategory) {
        return <Error message="Категория не найдена" fullscreen />;
    }

    return (
        <FlatList
            data={getDisplayItems()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyList}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={[
                styles.contentContainer,
                ((showingSection === 'subcategories' && displayChildCategories.length === 0) ||
                (showingSection === 'items' && categoryItems.length === 0))
                    ? styles.emptyContainer 
                    : null
            ]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#1976d2']}
                />
            }
        />
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    emptyContainer: {
        flexGrow: 1,
    },
    parentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    parentText: {
        color: '#1976d2',
        fontSize: 14,
        marginLeft: 4,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    icon: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    iconPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    descriptionContainer: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#1976d2',
    },
    descriptionText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 22,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#1976d2',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#1976d2',
        fontWeight: 'bold',
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
}); 