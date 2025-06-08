import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    TextInput, 
    RefreshControl,
    Alert
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCategories, deleteCategory } from '../../../features/categories/categoriesThunks';
import { Category, CategoryFilter } from '../../../types/category';
import { Loading } from '../../common/Loading';
import { Error } from '../../common/Error';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AdminCategoryItem } from './AdminCategoryItem';
import { AdminCategoryForm } from './AdminCategoryForm';

export const AdminCategoryList: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items, loading, error } = useAppSelector((state) => state.categories);
    
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [filter, setFilter] = useState<CategoryFilter>({
        is_active: undefined, // Для админа показываем все категории по умолчанию
    });
    
    useEffect(() => {
        loadCategories();
    }, [filter]);
    
    const loadCategories = async () => {
        await dispatch(fetchCategories(filter));
    };
    
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadCategories();
        setRefreshing(false);
    };
    
    const handleSearch = () => {
        setFilter({
            ...filter,
            search: searchQuery || undefined
        });
    };
    
    const clearSearch = () => {
        setSearchQuery('');
        setFilter({
            ...filter,
            search: undefined
        });
    };
    
    const handleCreateCategory = () => {
        setEditingCategory(null);
        setShowCreateForm(true);
    };
    
    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setShowCreateForm(true);
    };
    
    const handleDeleteCategory = (category: Category) => {
        Alert.alert(
            'Удаление категории',
            `Вы уверены, что хотите удалить категорию "${category.name}"?`,
            [
                {
                    text: 'Отмена',
                    style: 'cancel'
                },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(deleteCategory(category.id));
                            await loadCategories();
                        } catch (error) {
                            console.error('Ошибка при удалении категории:', error);
                            Alert.alert(
                                'Ошибка',
                                'Не удалось удалить категорию. Пожалуйста, попробуйте снова.'
                            );
                        }
                    }
                }
            ]
        );
    };
    
    const handleFormClose = () => {
        setShowCreateForm(false);
        setEditingCategory(null);
        loadCategories(); // Перезагружаем список после создания/редактирования
    };
    
    const handleFilterChange = (filterType: 'all' | 'active' | 'inactive') => {
        switch (filterType) {
            case 'all':
                setFilter({ ...filter, is_active: undefined });
                break;
            case 'active':
                setFilter({ ...filter, is_active: true });
                break;
            case 'inactive':
                setFilter({ ...filter, is_active: false });
                break;
        }
    };
    
    const renderHeader = () => (
        <View>
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
                        <TouchableOpacity onPress={clearSearch}>
                            <Icon name="close" size={20} color="#666" />
                        </TouchableOpacity>
                    ) : null}
                </View>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Поиск</Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Фильтр:</Text>
                <View style={styles.filterButtons}>
                    <TouchableOpacity 
                        style={[
                            styles.filterButton, 
                            filter.is_active === undefined && styles.filterButtonActive
                        ]}
                        onPress={() => handleFilterChange('all')}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            filter.is_active === undefined && styles.filterButtonTextActive
                        ]}>
                            Все
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.filterButton, 
                            filter.is_active === true && styles.filterButtonActive
                        ]}
                        onPress={() => handleFilterChange('active')}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            filter.is_active === true && styles.filterButtonTextActive
                        ]}>
                            Активные
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.filterButton, 
                            filter.is_active === false && styles.filterButtonActive
                        ]}
                        onPress={() => handleFilterChange('inactive')}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            filter.is_active === false && styles.filterButtonTextActive
                        ]}>
                            Неактивные
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            <TouchableOpacity 
                style={styles.createButton} 
                onPress={handleCreateCategory}
            >
                <Icon name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Создать категорию</Text>
            </TouchableOpacity>
        </View>
    );
    
    if (showCreateForm) {
        return (
            <AdminCategoryForm 
                category={editingCategory} 
                onClose={handleFormClose} 
            />
        );
    }
    
    if (loading && !refreshing && items.length === 0) {
        return <Loading text="Загрузка категорий..." />;
    }
    
    if (error && !refreshing) {
        return <Error message={error} onRetry={loadCategories} />;
    }
    
    return (
        <View style={styles.container}>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <AdminCategoryItem 
                        category={item} 
                        onEdit={() => handleEditCategory(item)}
                        onDelete={() => handleDeleteCategory(item)}
                    />
                )}
                ListHeaderComponent={renderHeader()}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="category" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Категории не найдены</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#1976d2']}
                    />
                }
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContainer: {
        flexGrow: 1,
        paddingBottom: 20,
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
    filterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    filterButtons: {
        flexDirection: 'row',
    },
    filterButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: '#1976d2',
    },
    filterButtonText: {
        color: '#333',
    },
    filterButtonTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4caf50',
        marginHorizontal: 16,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    },
}); 