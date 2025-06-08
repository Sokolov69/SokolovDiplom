import React, { useEffect, useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { FlatList, View, StyleSheet, Text, RefreshControl, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategories } from '../../features/categories/categoriesThunks';
import { CategoryCard } from './CategoryCard';
import { Loading } from '../common/Loading';
import { Error } from '../common/Error';
import { Category, CategoryFilter, CategoryShort } from '../../types/category';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CategoryListProps {
    parentId?: number | null;
    showSearch?: boolean;
    showFilters?: boolean;
}

// Интерфейс для методов SearchHeader
interface SearchHeaderRef {
    clearSearch: () => void;
}

// Отдельный мемоизированный компонент для поиска с внутренним состоянием
const SearchHeader = React.memo(forwardRef<SearchHeaderRef, {
    onSearch: (query: string) => void;
    onClearSearch: () => void;
}>(({ onSearch, onClearSearch }, ref) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Предоставляем методы для внешнего управления
    useImperativeHandle(ref, () => ({
        clearSearch: () => {
            setSearchQuery('');
        }
    }), []);
    
    const handleSearch = useCallback(() => {
        onSearch(searchQuery.trim());
    }, [searchQuery, onSearch]);
    
    const handleClear = useCallback(() => {
        setSearchQuery('');
        onClearSearch();
    }, [onClearSearch]);
    
    return (
        <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
                <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Поиск категорий..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={handleClear}>
                        <Icon name="close" size={20} color="#666" />
                    </TouchableOpacity>
                ) : null}
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Поиск</Text>
            </TouchableOpacity>
        </View>
    );
}));

export const CategoryList: React.FC<CategoryListProps> = React.memo(({ 
    parentId = null, 
    showSearch = true,
    showFilters = true 
}) => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const { items, loading, error } = useAppSelector((state) => state.categories);
    
    const [refreshing, setRefreshing] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const loadingRef = useRef(false);
    const lastFilterRef = useRef<string>('');
    const currentSearchQuery = useRef('');
    const searchHeaderRef = useRef<SearchHeaderRef>(null);
    
    // Создаем фильтр с правильными параметрами для корневых категорий
    const createFilter = useCallback((search?: string): CategoryFilter => {
        const filter: CategoryFilter = {
            is_active: true,
        };
        
        // Если parentId явно null или undefined, то это корневые категории
        if (parentId === null || parentId === undefined) {
            filter.parent = null; // Явно указываем null для корневых категорий
            console.log('[CategoryList] Создан фильтр для корневых категорий');
        } else {
            filter.parent = parentId;
            console.log('[CategoryList] Создан фильтр для дочерних категорий родителя:', parentId);
        }
        
        if (search) {
            filter.search = search;
        }
        
        return filter;
    }, [parentId]);
    
    // Мемоизированная функция загрузки категорий
    const loadCategories = useCallback(async (forceReload = false, searchText?: string) => {
        const filter = createFilter(searchText);
        const filterKey = JSON.stringify(filter);
        
        // Предотвращаем дублирующиеся запросы с одинаковыми фильтрами
        if (!forceReload && (loadingRef.current || lastFilterRef.current === filterKey)) {
            console.log('[CategoryList] Пропускаем дублирующийся запрос');
            return;
        }
        
        try {
            loadingRef.current = true;
            lastFilterRef.current = filterKey;
            console.log('[CategoryList] Загрузка категорий с фильтром:', filter);
            
            await dispatch(fetchCategories(filter)).unwrap();
            
            if (!isInitialized) {
                setIsInitialized(true);
            }
            
            console.log('[CategoryList] Категории загружены успешно');
        } catch (error: any) {
            console.error('[CategoryList] Ошибка при загрузке категорий:', error);
        } finally {
            loadingRef.current = false;
        }
    }, [dispatch, createFilter, isInitialized]);
    
    // Загружаем категории только при изменении parentId
    useEffect(() => {
        console.log('[CategoryList] useEffect для parentId:', parentId);
        setIsInitialized(false);
        loadCategories(true); // Принудительная загрузка при смене parentId
    }, [parentId]); // Убираем loadCategories из зависимостей чтобы избежать лишних запросов
    
    const handleCategoryPress = useCallback((category: Category | CategoryShort) => {
        navigation.navigate('CategoryDetail', { categoryId: category.id });
    }, [navigation]);
    
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadCategories(true); // Принудительная перезагрузка
        } finally {
            setRefreshing(false);
        }
    }, [loadCategories]);
    
    // Стабильные callback функции для поиска
    const handleSearchSubmit = useCallback((query: string) => {
        currentSearchQuery.current = query;
        if (query) {
            loadCategories(true, query);
        } else {
            loadCategories(true);
        }
    }, [loadCategories]);
    
    const handleClearSearch = useCallback(() => {
        currentSearchQuery.current = '';
        searchHeaderRef.current?.clearSearch(); // Сбрасываем поле через ref
        loadCategories(true);
    }, [loadCategories]);
    
    const renderHeader = useCallback(() => {
        if (!showSearch) return null;
        
        return (
            <SearchHeader
                ref={searchHeaderRef}
                onSearch={handleSearchSubmit}
                onClearSearch={handleClearSearch}
            />
        );
    }, [showSearch, handleSearchSubmit, handleClearSearch]);
    
    // Рендер элементов сетки
    const renderItem = useCallback(({ item }: { item: Category }) => (
        <CategoryCard
            category={item}
            onPress={handleCategoryPress}
            showChildren={false}
            tileMode={true}
        />
    ), [handleCategoryPress]);
    
    const renderEmptyComponent = useCallback(() => {
        if (loading || error) return null;
        
        const hasSearchQuery = currentSearchQuery.current.length > 0;
        
        return (
            <View style={styles.emptyContainer}>
                <Icon name="category" size={60} color="#ccc" />
                <Text style={styles.emptyText}>
                    {hasSearchQuery ? 'Категории не найдены по запросу' : 'Категории не найдены'}
                </Text>
                {hasSearchQuery && (
                    <TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchButton}>
                        <Text style={styles.clearSearchText}>Очистить поиск</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [loading, error, handleClearSearch]);
    
    // Показываем загрузку только при первой загрузке
    if (loading && !refreshing && !isInitialized) {
        return <Loading text="Загрузка категорий..." fullscreen />;
    }
    
    // Показываем ошибку только если нет данных
    if (error && !refreshing && items.length === 0) {
        return <Error 
            message={error} 
            onRetry={() => loadCategories(true)} 
            fullscreen 
        />;
    }
    
    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#1976d2']}
                />
            }
        />
    );
});

const styles = StyleSheet.create({
    listContainer: {
        flexGrow: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
        alignItems: 'center',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
    },
    searchButton: {
        marginLeft: 8,
        backgroundColor: '#1976d2',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    clearSearchButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#1976d2',
        borderRadius: 8,
    },
    clearSearchText: {
        color: 'white',
        fontWeight: 'bold',
    },
}); 