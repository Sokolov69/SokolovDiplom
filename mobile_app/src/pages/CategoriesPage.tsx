import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryList } from '../components/categories/CategoryList';

export const CategoriesPage: React.FC = () => {
    console.log("[CategoriesPage] LOADED")
    return (
        <View style={styles.container}>
            <CategoryList parentId={null} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
}); 