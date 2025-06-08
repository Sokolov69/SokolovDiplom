import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector, useIsAdmin } from '../store/hooks';
import { useNavigation } from '@react-navigation/native';
import AdminTabMenu from '../components/admin/AdminTabMenu';

export const AdminPage: React.FC = () => {
    const { user } = useAppSelector((state) => state.auth);
    const navigation = useNavigation<any>();
    const hasAdminAccess = useIsAdmin();
    
    useEffect(() => {
        // Перенаправление неавторизованных пользователей
        if (!user || !hasAdminAccess) {
            navigation.navigate('Home');
        }
    }, [user, navigation, hasAdminAccess]);
    
    // Если пользователь не администратор, не отображаем содержимое
    if (!user || !hasAdminAccess) {
        return null;
    }
    
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Панель администратора</Text>
                <Text style={styles.subtitle}>
                    Добро пожаловать, {user.first_name || user.username}!
                </Text>
            </View>
            
            <AdminTabMenu />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#1976d2',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    subtitle: {
        fontSize: 16,
        color: 'white',
        opacity: 0.9,
        marginTop: 8,
    },
}); 