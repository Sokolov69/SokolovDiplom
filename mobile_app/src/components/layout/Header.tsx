import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppSelector, useIsAdmin } from '../../store/hooks';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const Header: React.FC = () => {
    const { user } = useAppSelector((state) => state.auth);
    const navigation = useNavigation();
    const hasAdminAccess = useIsAdmin();

    console.log('[Header] Render - user:', user ? `${user.username} (ID: ${user.id})` : 'null');
    console.log('[Header] hasAdminAccess:', hasAdminAccess);

    // Если пользователь не авторизован, не отображаем компонент
    if (!user) {
        console.log('[Header] No user, returning null');
        return null;
    }

    console.log('[Header] Rendering header with user:', user.username);

    // Функция для навигации с очисткой стека
    const navigateAndReset = (routeName: string) => {
        console.log(`[Header] Навигация с очисткой стека на: ${routeName}`);
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: routeName }],
            })
        );
    };

    const handleNavigateToHome = () => {
        navigateAndReset('Home');
    };

    const handleNavigateToCategories = () => {
        navigateAndReset('Categories');
    };
    
    const handleNavigateToFavorites = () => {
        navigateAndReset('Favorites');
    };
    
    const handleNavigateToNewPost = () => {
        navigateAndReset('CreateItem');
    };
    
    const handleNavigateToTrades = () => {
        navigateAndReset('Trades');
    };
    
    const handleNavigateToProfile = () => {
        if (user) {
            navigateAndReset('Profile');
        } else {
            navigateAndReset('Login');
        }
    };

    const handleNavigateToAdmin = () => {
        navigateAndReset('Admin');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.tabButton} 
                onPress={handleNavigateToCategories}
            >
                <Icon name="category" size={24} color="#1976d2" />
                <Text style={styles.tabText}>Каталог</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={styles.tabButton} 
                onPress={handleNavigateToFavorites}
            >
                <Icon name="favorite" size={24} color="#757575" />
                <Text style={styles.tabText}>Избранное</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={styles.newPostButton} 
                onPress={handleNavigateToNewPost}
            >
                <Icon name="add-circle" size={40} color="#1976d2" />
                <Text style={styles.tabText}>Создать</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={styles.tabButton} 
                onPress={handleNavigateToTrades}
            >
                <Icon name="message" size={24} color="#757575" />
                <Text style={styles.tabText}>Обмены</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={styles.tabButton} 
                onPress={handleNavigateToProfile}
            >
                <Icon name="person" size={24} color="#757575" />
                <Text style={styles.tabText}>Профиль</Text>
            </TouchableOpacity>

            {hasAdminAccess && (
                <TouchableOpacity 
                    style={styles.tabButton} 
                    onPress={handleNavigateToAdmin}
                >
                    <Icon name="admin-panel-settings" size={24} color="#757575" />
                    <Text style={styles.tabText}>Админ</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        flex: 1,
    },
    newPostButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -15,
        flex: 1,
    },
    tabText: {
        fontSize: 11,
        marginTop: 2,
        color: '#757575',
    },
}); 