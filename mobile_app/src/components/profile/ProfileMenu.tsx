import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, SafeAreaView, StatusBar } from 'react-native';
import { useAppDispatch, useAppSelector, useIsAdmin } from '../../store/hooks';
import { logout } from '../../features/auth/authThunks';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface ProfileMenuProps {
    username: string;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ username }) => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const hasAdminAccess = useIsAdmin();
    const [isVisible, setIsVisible] = useState(false);
    const slideAnim = React.useRef(new Animated.Value(300)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    
    const handleMenu = () => {
        setIsVisible(true);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            setIsVisible(false);
        });
    };

    const handleLogout = async () => {
        await dispatch(logout());
        handleClose();
    };

    const navigateToProfile = () => {
        navigation.navigate('Profile');
        handleClose();
    };
    
    const navigateToAdmin = () => {
        navigation.navigate('Admin');
        handleClose();
    };

    return (
        <>
            <TouchableOpacity onPress={handleMenu}>
                <Icon name="account-circle" size={24} color="white" />
            </TouchableOpacity>
            <Modal
                visible={isVisible}
                transparent={true}
                animationType="none"
                onRequestClose={handleClose}
                statusBarTranslucent={true}
            >
                <TouchableOpacity 
                    style={styles.modalContainer} 
                    activeOpacity={1} 
                    onPress={handleClose}
                >
                    <Animated.View 
                        style={[
                            styles.overlay,
                            { opacity: fadeAnim }
                        ]}
                    />
                    <Animated.View 
                        style={[
                            styles.menuContainer,
                            { transform: [{ translateX: slideAnim }] }
                        ]}
                    >
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.menuHeader}>
                                <Text style={styles.username}>{username}</Text>
                                <TouchableOpacity onPress={handleClose}>
                                    <Icon name="close" size={24} color="#1976d2" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.menuContent}>
                                <TouchableOpacity style={styles.menuItem} onPress={navigateToProfile}>
                                    <Icon name="person" size={20} color="#1976d2" />
                                    <Text style={styles.menuText}>Профиль</Text>
                                </TouchableOpacity>
                                
                                {hasAdminAccess && (
                                    <TouchableOpacity style={styles.menuItem} onPress={navigateToAdmin}>
                                        <Icon name="admin-panel-settings" size={20} color="#1976d2" />
                                        <Text style={styles.menuText}>Панель администратора</Text>
                                    </TouchableOpacity>
                                )}
                                
                                <TouchableOpacity style={styles.menuItem} onPress={handleClose}>
                                    <Icon name="settings" size={20} color="#1976d2" />
                                    <Text style={styles.menuText}>Настройки</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                                    <Icon name="logout" size={20} color="#1976d2" />
                                    <Text style={styles.menuText}>Выйти</Text>
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    menuContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '80%',
        backgroundColor: 'white',
        paddingTop: StatusBar.currentHeight,
    },
    safeArea: {
        flex: 1,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    menuContent: {
        flex: 1,
        padding: 20,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    menuText: {
        fontSize: 16,
        color: '#1976d2',
    },
}); 