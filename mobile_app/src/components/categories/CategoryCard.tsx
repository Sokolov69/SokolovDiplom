import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Category, CategoryShort } from '../../types/category';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CategoryCardProps {
    category: Category | CategoryShort;
    onPress: (category: Category | CategoryShort) => void;
    showChildren?: boolean;
    tileMode?: boolean; // Плиточный режим отображения
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
    category, 
    onPress,
    showChildren = false,
    tileMode = true // По умолчанию используем плиточный режим
}) => {
    // Проверяем наличие дочерних элементов и логируем для отладки
    const hasChildren = 'children' in category && 
                        category.children && 
                        Array.isArray(category.children) && 
                        category.children.length > 0;
    
    // Выбираем стиль в зависимости от режима отображения
    const containerStyle = tileMode ? styles.tileContainer : styles.listContainer;
    const contentStyle = tileMode ? styles.tileContent : styles.listContent;
    const iconStyle = tileMode ? styles.tileIcon : styles.listIcon;
    const placeholderStyle = tileMode ? styles.tileIconPlaceholder : styles.listIconPlaceholder;
    const textContainerStyle = tileMode ? styles.tileTextContainer : styles.listTextContainer;
    const nameStyle = tileMode ? styles.tileName : styles.listName;
    const descriptionStyle = tileMode ? styles.tileDescription : styles.listDescription;
    
    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={() => onPress(category)}
            activeOpacity={0.7}
        >
            <View style={contentStyle}>
                {category.icon ? (
                    <Image 
                        source={{ uri: category.icon }} 
                        style={iconStyle} 
                        resizeMode="contain"
                    />
                ) : (
                    <View style={placeholderStyle}>
                        <Icon name="category" size={tileMode ? 28 : 24} color="#1976d2" />
                    </View>
                )}
                
                <View style={textContainerStyle}>
                    <Text style={nameStyle} numberOfLines={2}>
                        {category.name || 'Без названия'}
                    </Text>
                    {!tileMode && 'description' in category && category.description && (
                        <Text style={descriptionStyle} numberOfLines={2}>
                            {category.description}
                        </Text>
                    )}
                </View>
                
                {!tileMode && (
                    <Icon 
                        name="chevron-right" 
                        size={24} 
                        color="#1976d2" 
                        style={styles.chevron}
                    />
                )}
            </View>
            
            {showChildren && hasChildren && !tileMode && (
                <View style={styles.childrenContainer}>
                    {(category as Category).children?.map((child) => (
                        <TouchableOpacity
                            key={child.id}
                            style={styles.childItem}
                            onPress={() => onPress(child)}
                        >
                            <Text style={styles.childName}>{child.name || 'Без названия'}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
};

// Получаем ширину экрана для расчета размера плиток
const screenWidth = Dimensions.get('window').width;
const tileSize = (screenWidth - 48) / 2; // 2 плитки в ряд с отступами

const styles = StyleSheet.create({
    // Стили для списочного режима
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginHorizontal: 16,
        marginVertical: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    listContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    listIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    listIconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    listName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    listDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    
    // Стили для плиточного режима
    tileContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 8,
        width: tileSize,
        aspectRatio: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        overflow: 'hidden',
    },
    tileContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    tileIcon: {
        width: tileSize * 0.4,
        height: tileSize * 0.4,
        borderRadius: tileSize * 0.2,
        marginBottom: 12,
    },
    tileIconPlaceholder: {
        width: tileSize * 0.4,
        height: tileSize * 0.4,
        borderRadius: tileSize * 0.2,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    tileTextContainer: {
        alignItems: 'center',
    },
    tileName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    tileDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    
    // Общие стили
    chevron: {
        marginLeft: 8,
    },
    childrenContainer: {
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    childItem: {
        padding: 8,
        paddingLeft: 16,
        borderLeftWidth: 2,
        borderLeftColor: '#1976d2',
        marginVertical: 4,
    },
    childName: {
        fontSize: 14,
        color: '#1976d2',
    },
}); 