import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const HomePage: React.FC = () => {
    const navigation = useNavigation();

    console.log('[HomePage] Rendering');

    const handleNavigateToCategories = () => {
        navigation.navigate('Categories' as never);
    };

    const handleNavigateToProfile = () => {
        navigation.navigate('Profile' as never);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Добро пожаловать!</Text>
                <Text style={styles.heroSubtitle}>
                    Здесь вы можете обмениваться вещами с другими пользователями
                </Text>
            </View>
            
            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleNavigateToCategories}
                >
                    <View style={[styles.menuIcon, { backgroundColor: '#e3f2fd' }]}>
                        <Icon name="category" size={32} color="#1976d2" />
                    </View>
                    <Text style={styles.menuTitle}>Категории</Text>
                    <Text style={styles.menuDescription}>
                        Просмотр категорий товаров для обмена
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleNavigateToProfile}
                >
                    <View style={[styles.menuIcon, { backgroundColor: '#e8f5e9' }]}>
                        <Icon name="person" size={32} color="#388e3c" />
                    </View>
                    <Text style={styles.menuTitle}>Профиль</Text>
                    <Text style={styles.menuDescription}>
                        Управление личными данными
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    heroSection: {
        padding: 24,
        backgroundColor: '#1976d2',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'white',
        opacity: 0.9,
    },
    menuContainer: {
        padding: 16,
    },
    menuItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    menuIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    menuDescription: {
        fontSize: 14,
        color: '#666',
    },
}); 