import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryDetail } from '../components/categories/CategoryDetail';
import { RouteProp, useRoute } from '@react-navigation/native';

type CategoryDetailParamList = {
    CategoryDetail: {
        categoryId: number;
    };
};

export const CategoryDetailPage: React.FC = () => {
    const route = useRoute<RouteProp<CategoryDetailParamList, 'CategoryDetail'>>();
    const categoryId = route.params?.categoryId || 0;
    
    return (
        <View style={styles.container}>
            <CategoryDetail categoryId={categoryId} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
}); 