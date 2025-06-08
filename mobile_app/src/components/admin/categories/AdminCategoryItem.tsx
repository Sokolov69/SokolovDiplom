import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Category } from '../../../types/category';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AdminCategoryItemProps {
    category: Category;
    onEdit: () => void;
    onDelete: () => void;
}

export const AdminCategoryItem: React.FC<AdminCategoryItemProps> = ({ 
    category, 
    onEdit, 
    onDelete 
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.leftContent}>
                    {category.icon ? (
                        <Image 
                            source={{ uri: category.icon }} 
                            style={styles.icon} 
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.iconPlaceholder}>
                            <Icon name="category" size={24} color="#1976d2" />
                        </View>
                    )}
                </View>
                
                <View style={styles.centerContent}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{category.name}</Text>
                        <View style={[
                            styles.statusBadge, 
                            { backgroundColor: category.is_active ? '#e8f5e9' : '#ffebee' }
                        ]}>
                            <Text style={[
                                styles.statusText,
                                { color: category.is_active ? '#2e7d32' : '#c62828' }
                            ]}>
                                {category.is_active ? 'Активна' : 'Неактивна'}
                            </Text>
                        </View>
                    </View>
                    
                    {category.description && (
                        <Text style={styles.description} numberOfLines={2}>
                            {category.description}
                        </Text>
                    )}
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>ID: {category.id}</Text>
                        <Text style={styles.infoText}>•</Text>
                        <Text style={styles.infoText}>Slug: {category.slug}</Text>
                        <Text style={styles.infoText}>•</Text>
                        <Text style={styles.infoText}>
                            Уровень: {category.level}
                            {category.parent !== null ? ` (Родитель: ${category.parent})` : ' (Корневая)'}
                        </Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.actionsContainer}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]} 
                    onPress={onEdit}
                >
                    <Icon name="edit" size={20} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]} 
                    onPress={onDelete}
                >
                    <Icon name="delete" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    content: {
        flexDirection: 'row',
        padding: 16,
    },
    leftContent: {
        marginRight: 16,
    },
    centerContent: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    statusBadge: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 12,
        color: '#888',
        marginRight: 6,
    },
    icon: {
        width: 48,
        height: 48,
        borderRadius: 4,
    },
    iconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 4,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionsContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    editButton: {
        backgroundColor: '#1976d2',
        borderBottomLeftRadius: 8,
    },
    deleteButton: {
        backgroundColor: '#e53935',
        borderBottomRightRadius: 8,
    },
}); 