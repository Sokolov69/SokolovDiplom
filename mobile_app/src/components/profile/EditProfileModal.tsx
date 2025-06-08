import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    ScrollView, 
    TouchableOpacity,
    Alert
} from 'react-native';
import { Input, Button } from '@rneui/themed';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfile } from '../../features/profile/profileThunks';
import { updateUser, changePassword } from '../../features/auth/authThunks';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
    const dispatch = useAppDispatch();
    const { profile, loading: profileLoading } = useAppSelector((state) => state.profile);
    const { user, loading: authLoading, validationErrors } = useAppSelector((state) => state.auth);

    // Вкладки
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    // Состояния формы профиля
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bio, setBio] = useState('');

    // Состояния формы смены пароля
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const isLoading = profileLoading || authLoading;

    // Заполняем поля при открытии модального окна
    useEffect(() => {
        if (visible) {
            setFirstName(user?.first_name || '');
            setLastName(user?.last_name || '');
            setEmail(user?.email || '');
            setPhoneNumber(profile?.phone_number || '');
            setBio(profile?.bio || '');
            
            // Сбрасываем поля пароля
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setActiveTab('profile');
        }
    }, [visible, profile, user]);

    const handleSaveProfile = async () => {
        try {
            // Обновляем данные пользователя (имя, фамилия, email)
            const userUpdateData = {
                first_name: firstName.trim() || undefined,
                last_name: lastName.trim() || undefined,
                email: email.trim() || undefined,
            };

            // Удаляем undefined значения
            const cleanedUserData = Object.fromEntries(
                Object.entries(userUpdateData).filter(([_, value]) => value !== undefined)
            );

            if (Object.keys(cleanedUserData).length > 0) {
                await dispatch(updateUser(cleanedUserData)).unwrap();
            }

            // Обновляем данные профиля (телефон, о себе)
            const profileUpdateData = {
                phone_number: phoneNumber.trim() || undefined,
                bio: bio.trim() || undefined,
            };

            const cleanedProfileData = Object.fromEntries(
                Object.entries(profileUpdateData).filter(([_, value]) => value !== undefined)
            );

            if (Object.keys(cleanedProfileData).length > 0) {
                await dispatch(updateProfile(cleanedProfileData)).unwrap();
            }

            Alert.alert('Успех', 'Профиль успешно обновлен', [
                { text: 'OK', onPress: onClose }
            ]);
        } catch (error: any) {
            console.error('Ошибка при обновлении профиля:', error);
            Alert.alert('Ошибка', error || 'Не удалось обновить профиль');
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Ошибка', 'Заполните все поля пароля');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Ошибка', 'Новые пароли не совпадают');
            return;
        }

        try {
            await dispatch(changePassword({
                old_password: oldPassword,
                new_password: newPassword,
                new_password2: confirmPassword,
            })).unwrap();

            Alert.alert('Успех', 'Пароль успешно изменен', [
                { text: 'OK', onPress: () => {
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                }}
            ]);
        } catch (error: any) {
            console.error('Ошибка при смене пароля:', error);
            Alert.alert('Ошибка', error || 'Не удалось изменить пароль');
        }
    };

    const handleCancel = () => {
        // Сбрасываем изменения
        setFirstName(user?.first_name || '');
        setLastName(user?.last_name || '');
        setEmail(user?.email || '');
        setPhoneNumber(profile?.phone_number || '');
        setBio(profile?.bio || '');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setActiveTab('profile');
        onClose();
    };

    const renderProfileTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Input
                label="Имя"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Введите ваше имя"
                containerStyle={styles.inputContainer}
                leftIcon={<Icon name="person" size={20} color="#666" />}
                errorMessage={validationErrors?.first_name?.[0]}
            />

            <Input
                label="Фамилия"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Введите вашу фамилию"
                containerStyle={styles.inputContainer}
                leftIcon={<Icon name="person-outline" size={20} color="#666" />}
                errorMessage={validationErrors?.last_name?.[0]}
            />

            <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Введите email"
                containerStyle={styles.inputContainer}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Icon name="email" size={20} color="#666" />}
                errorMessage={validationErrors?.email?.[0]}
            />

            <Input
                label="Номер телефона"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Введите номер телефона"
                containerStyle={styles.inputContainer}
                keyboardType="phone-pad"
                leftIcon={<Icon name="phone" size={20} color="#666" />}
            />

            <Input
                label="О себе"
                value={bio}
                onChangeText={setBio}
                placeholder="Расскажите о себе"
                containerStyle={styles.inputContainer}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                leftIcon={<Icon name="info" size={20} color="#666" />}
            />
        </ScrollView>
    );

    const renderPasswordTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Input
                label="Текущий пароль"
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Введите текущий пароль"
                containerStyle={styles.inputContainer}
                secureTextEntry
                leftIcon={<Icon name="lock-outline" size={20} color="#666" />}
                errorMessage={validationErrors?.old_password?.[0]}
            />

            <Input
                label="Новый пароль"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Введите новый пароль"
                containerStyle={styles.inputContainer}
                secureTextEntry
                leftIcon={<Icon name="lock" size={20} color="#666" />}
                errorMessage={validationErrors?.new_password?.[0]}
            />

            <Input
                label="Подтвердите новый пароль"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Подтвердите новый пароль"
                containerStyle={styles.inputContainer}
                secureTextEntry
                leftIcon={<Icon name="lock" size={20} color="#666" />}
                errorMessage={validationErrors?.new_password2?.[0]}
            />

            <Button
                title="Изменить пароль"
                onPress={handleChangePassword}
                buttonStyle={[styles.button, styles.passwordButton]}
                loading={isLoading}
                disabled={isLoading}
                icon={<Icon name="security" size={20} color="white" style={{ marginRight: 8 }} />}
            />
        </ScrollView>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleCancel}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                        <Icon name="close" size={24} color="#1976d2" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Редактировать профиль</Text>
                    <TouchableOpacity 
                        onPress={activeTab === 'profile' ? handleSaveProfile : undefined} 
                        style={styles.saveButton}
                        disabled={activeTab !== 'profile'}
                    >
                        {activeTab === 'profile' && (
                            <Text style={styles.saveButtonText}>Сохранить</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Custom Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
                        onPress={() => setActiveTab('profile')}
                    >
                        <Icon 
                            name="person" 
                            size={20} 
                            color={activeTab === 'profile' ? "#1976d2" : "#666"} 
                        />
                        <Text style={[
                            styles.tabText, 
                            activeTab === 'profile' && styles.activeTabText
                        ]}>
                            Профиль
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'password' && styles.activeTab]}
                        onPress={() => setActiveTab('password')}
                    >
                        <Icon 
                            name="lock" 
                            size={20} 
                            color={activeTab === 'password' ? "#1976d2" : "#666"} 
                        />
                        <Text style={[
                            styles.tabText, 
                            activeTab === 'password' && styles.activeTabText
                        ]}>
                            Пароль
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {activeTab === 'profile' ? renderProfileTab() : renderPasswordTab()}
                </View>

                {/* Footer только для вкладки профиля */}
                {activeTab === 'profile' && (
                    <View style={styles.footer}>
                        <Button
                            title="Отмена"
                            onPress={handleCancel}
                            buttonStyle={[styles.button, styles.cancelButtonStyle]}
                            titleStyle={styles.cancelButtonTitle}
                            disabled={isLoading}
                        />
                        <Button
                            title="Сохранить"
                            onPress={handleSaveProfile}
                            buttonStyle={[styles.button, styles.saveButtonStyle]}
                            loading={isLoading}
                            disabled={isLoading}
                        />
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50, // Учитываем notch
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cancelButton: {
        padding: 4,
    },
    saveButton: {
        padding: 4,
    },
    saveButtonText: {
        color: '#1976d2',
        fontSize: 16,
        fontWeight: '600',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#1976d2',
    },
    tabText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#1976d2',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    tabContent: {
        flex: 1,
        paddingTop: 20,
    },
    inputContainer: {
        marginBottom: 15,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        gap: 12,
    },
    button: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 12,
    },
    cancelButtonStyle: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonTitle: {
        color: '#666',
    },
    saveButtonStyle: {
        backgroundColor: '#1976d2',
    },
    passwordButton: {
        backgroundColor: '#1976d2',
        marginTop: 20,
    },
}); 