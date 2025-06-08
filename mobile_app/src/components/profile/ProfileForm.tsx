import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Card, Button, Input, Avatar } from '@rneui/themed';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../features/auth/authThunks';
import { clearAllState } from '../../features/auth/authSlice';
import { clearProfile } from '../../features/profile/profileSlice';
import { clearItems } from '../../features/items/itemsSlice';
import { clearTrades } from '../../features/trades/tradesSlice';
import { clearCategories } from '../../features/categories/categoriesSlice';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { User } from '../../types/auth';
import { UserProfile } from '../../types/profile';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatar } from '../../features/profile/profileThunks';
import { Platform, ActivityIndicator } from 'react-native';
import { LocationList } from './LocationList';
import { AddLocationModal } from './AddLocationModal';
import { EditProfileModal } from './EditProfileModal';

export const ProfileForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const [isUploading, setIsUploading] = useState(false);
    const [isAddLocationModalVisible, setIsAddLocationModalVisible] = useState(false);
    const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
    
    const { profile, primaryLocation, locations, loading, error } = useAppSelector((state) => state.profile);
    const { user } = useAppSelector((state) => state.auth);

    const handleLogout = async () => {
        try {
            await dispatch(logout());
            await dispatch(clearAllState());
            await dispatch(clearProfile());
            await dispatch(clearItems());
            await dispatch(clearTrades());
            await dispatch(clearCategories());
            navigation.navigate('Login');
        } catch (err: any) {
            console.error('Ошибка при выходе из аккаунта:', err);
        }
    };

    const handleEditProfile = () => {
        setIsEditProfileModalVisible(true);
    };

    // Обработчик выбора и загрузки новой аватарки
    const handleChooseAvatar = async () => {
        try {
            // Запрос разрешения на доступ к галерее
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (!permissionResult.granted) {
                Alert.alert(
                    'Требуется разрешение',
                    'Необходимо разрешение на доступ к галерее для выбора фото.',
                    [{ text: 'OK' }]
                );
                return;
            }
            
            // Открытие галереи для выбора изображения
            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
            
            if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                const selectedAsset = pickerResult.assets[0];
                
                // Проверка размера файла (до 5 МБ)
                const imageResponse = await fetch(selectedAsset.uri);
                const imageBlob = await imageResponse.blob();
                
                if (imageBlob.size > 5 * 1024 * 1024) {
                    Alert.alert(
                        'Слишком большой файл',
                        'Размер фото не должен превышать 5 МБ.',
                        [{ text: 'OK' }]
                    );
                    return;
                }
                
                // Загрузка аватара
                setIsUploading(true);
                
                // Создаем объект File или используем объект blob для React Native
                let avatarFile: any;
                if (Platform.OS === 'web') {
                    const fileName = selectedAsset.uri.split('/').pop() || 'avatar.jpg';
                    avatarFile = new File([imageBlob], fileName, { 
                        type: imageBlob.type || 'image/jpeg' 
                    });
                } else {
                    avatarFile = {
                        uri: selectedAsset.uri,
                        type: imageBlob.type || 'image/jpeg',
                        name: selectedAsset.uri.split('/').pop() || 'avatar.jpg'
                    };
                }
                
                const uploadResult = await dispatch(uploadAvatar({ avatar: avatarFile }));
                
                if (uploadAvatar.rejected.match(uploadResult)) {
                    Alert.alert(
                        'Ошибка загрузки',
                        `Не удалось загрузить аватар: ${uploadResult.payload || 'Неизвестная ошибка'}`,
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert(
                        'Успешно',
                        'Аватар успешно обновлен',
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (error) {
            console.error('Ошибка при выборе/загрузке аватара:', error);
            Alert.alert(
                'Ошибка',
                'Произошла ошибка при обработке изображения',
                [{ text: 'OK' }]
            );
        } finally {
            setIsUploading(false);
        }
    };

    if (!profile && !user) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Необходимо войти в аккаунт</Text>
                <Button
                    title="Войти"
                    onPress={() => navigation.navigate('Login')}
                    buttonStyle={styles.button}
                />
            </View>
        );
    }

    // Используем user до тех пор, пока profile не загрузится
    const userData: UserProfile | User | null = profile || user || null;
    const username = userData?.username || '';
    const email = userData?.email || '';
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || username;
    const avatarUrl = profile?.avatar_url || '';
    const initials = username ? username.substring(0, 2).toUpperCase() : 'ПП';

    return (
        <View style={styles.container}>
            <Card containerStyle={styles.card}>
                <Card.Title h4>Профиль пользователя</Card.Title>
                <Card.Divider />
                
                <View style={styles.avatarContainer}>
                    <Avatar
                        size={100}
                        rounded
                        source={avatarUrl ? { uri: avatarUrl } : undefined}
                        title={!avatarUrl ? initials : undefined}
                        containerStyle={styles.avatar}
                    >
                        {isUploading ? (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator size="small" color="#ffffff" />
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={styles.editAvatarButton}
                                onPress={handleChooseAvatar}
                                disabled={loading || isUploading}
                            >
                                <Icon name="edit" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </Avatar>
                    
                    {error && typeof error === 'string' && error.includes('аватар') && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                </View>
                
                {error && typeof error === 'string' && !error.includes('аватар') && (
                    <Text style={styles.error}>{error}</Text>
                )}
                
                {/* Карточка с основными данными пользователя */}
                <View style={styles.userInfoCard}>
                    <View style={styles.userInfoRow}>
                        <Icon name="person" size={20} color="#1976d2" style={styles.infoIcon} />
                        <View style={styles.userInfoContent}>
                            <Text style={styles.infoLabel}>Полное имя</Text>
                            <Text style={styles.infoValue}>{fullName}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.userInfoRow}>
                        <Icon name="alternate-email" size={20} color="#1976d2" style={styles.infoIcon} />
                        <View style={styles.userInfoContent}>
                            <Text style={styles.infoLabel}>Имя пользователя</Text>
                            <Text style={styles.infoValue}>@{username}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.userInfoRow}>
                        <Icon name="email" size={20} color="#1976d2" style={styles.infoIcon} />
                        <View style={styles.userInfoContent}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{email}</Text>
                        </View>
                    </View>
                    
                    {profile?.phone_number && (
                        <View style={styles.userInfoRow}>
                            <Icon name="phone" size={20} color="#1976d2" style={styles.infoIcon} />
                            <View style={styles.userInfoContent}>
                                <Text style={styles.infoLabel}>Телефон</Text>
                                <Text style={styles.infoValue}>{profile.phone_number}</Text>
                            </View>
                        </View>
                    )}
                    
                    {profile?.bio && (
                        <View style={styles.userInfoRow}>
                            <Icon name="info" size={20} color="#1976d2" style={styles.infoIcon} />
                            <View style={styles.userInfoContent}>
                                <Text style={styles.infoLabel}>О себе</Text>
                                <Text style={styles.infoValueMultiline}>{profile.bio}</Text>
                            </View>
                        </View>
                    )}
                </View>
                
                {/* Статистика пользователя */}
                {(profile?.rating !== undefined && profile?.rating !== null) || 
                 (profile?.successful_trades !== undefined) ? (
                    <View style={styles.statsCard}>
                        <Text style={styles.statsTitle}>Статистика</Text>
                        
                        {profile?.rating !== undefined && profile?.rating !== null && (
                            <View style={styles.statRow}>
                                <Icon name="star" size={18} color="#FFD700" style={styles.statIcon} />
                                <Text style={styles.statLabel}>Рейтинг:</Text>
                                <Text style={styles.statValue}>
                                    {parseFloat(profile.rating.toString()).toFixed(1)} ({profile.total_reviews || 0} отзывов)
                                </Text>
                            </View>
                        )}
                        
                        {profile?.successful_trades !== undefined && (
                            <View style={styles.statRow}>
                                <Icon name="swap-horiz" size={18} color="#4CAF50" style={styles.statIcon} />
                                <Text style={styles.statLabel}>Успешных сделок:</Text>
                                <Text style={styles.statValue}>{profile.successful_trades}</Text>
                            </View>
                        )}
                    </View>
                ) : null}
                
                <Button
                    title="Редактировать профиль"
                    icon={<Icon name="edit" size={20} color="white" style={{ marginRight: 10 }} />}
                    buttonStyle={styles.button}
                    disabled={loading}
                    onPress={handleEditProfile}
                />
            </Card>
            
            <Card containerStyle={styles.card}>
                <LocationList onAddLocation={() => setIsAddLocationModalVisible(true)} />
            </Card>
            
            <Card containerStyle={styles.card}>
                <Button
                    title="Выйти из аккаунта"
                    onPress={handleLogout}
                    buttonStyle={styles.logoutButton}
                    icon={<Icon name="logout" size={20} color="white" style={{ marginRight: 10 }} />}
                    disabled={loading}
                />
            </Card>
            
            <AddLocationModal 
                visible={isAddLocationModalVisible} 
                onClose={() => setIsAddLocationModalVisible(false)} 
            />
            
            <EditProfileModal 
                visible={isEditProfileModalVisible} 
                onClose={() => setIsEditProfileModalVisible(false)} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    card: {
        borderRadius: 10,
        padding: 10,
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    avatar: {
        backgroundColor: '#1976d2',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#1976d2',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        marginTop: 10,
    },
    logoutButton: {
        backgroundColor: '#d32f2f',
        borderRadius: 8,
        marginVertical: 10,
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    infoContainer: {
        flexDirection: 'row',
        marginVertical: 5,
        paddingHorizontal: 10,
    },
    infoLabel: {
        fontWeight: 'bold',
        marginRight: 5,
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
    },
    locationContainer: {
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 5,
        marginVertical: 10,
    },
    locationTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 5,
    },
    locationText: {
        fontSize: 14,
    },
    userInfoCard: {
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 5,
        marginVertical: 10,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    infoIcon: {
        marginRight: 10,
    },
    userInfoContent: {
        flex: 1,
    },
    infoValueMultiline: {
        flexWrap: 'wrap',
    },
    statsCard: {
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 5,
        marginVertical: 10,
    },
    statsTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 10,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    statIcon: {
        marginRight: 10,
    },
    statLabel: {
        fontWeight: 'bold',
        marginRight: 5,
        fontSize: 14,
    },
    statValue: {
        fontSize: 14,
    },
}); 