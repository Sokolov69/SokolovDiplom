import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../../features/auth/authThunks';
import { FormContainer } from '../common/FormContainer';
import { PasswordField } from '../common/PasswordField';
import { LoginData } from '../../types/auth';
import { useForm } from '../../hooks/useForm';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LoginForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const { error } = useAppSelector((state) => state.auth);

    const {
        values,
        validationErrors,
        isSubmitting,
        handleChange,
        handleSubmit,
        getFieldError,
    } = useForm<LoginData>({
        initialValues: {
            username: '',
            password: '',
        },
        onSubmit: async (formData) => {
            await dispatch(login(formData));
        },
    });

    const renderError = () => {
        if (!error) return null;
        
        if (typeof error === 'object') {
            const errorMessages = Object.values(error).flat();
            return errorMessages.join(', ');
        }
        
        return error;
    };

    return (
        <FormContainer title="Вход">
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{renderError()}</Text>
                </View>
            )}
            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Имя пользователя
                        <Text style={styles.required}> *</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, getFieldError('username') && styles.errorInput]}
                        value={values.username}
                        onChangeText={(text) => handleChange('username', text)}
                        placeholder="Введите имя пользователя"
                    />
                    {getFieldError('username') && (
                        <Text style={styles.errorText}>{getFieldError('username')}</Text>
                    )}
                </View>
                <PasswordField
                    label="Пароль"
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    error={!!getFieldError('password')}
                    helperText={getFieldError('password')}
                    required
                />
                <TouchableOpacity
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.buttonText}>
                        {isSubmitting ? 'Вход...' : 'Войти'}
                    </Text>
                </TouchableOpacity>
                <View style={styles.registerLinkContainer}>
                    <Text style={styles.registerText}>
                        Нет аккаунта?{' '}
                        <Text 
                            style={styles.registerLink}
                            onPress={() => navigation.navigate('Register')}
                        >
                            Зарегистрироваться
                        </Text>
                    </Text>
                </View>
            </View>
        </FormContainer>
    );
};

const styles = StyleSheet.create({
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    required: {
        color: 'red',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    errorInput: {
        borderColor: 'red',
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 5,
        marginBottom: 16,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
    },
    button: {
        backgroundColor: '#1976d2',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerLinkContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
        color: '#666',
    },
    registerLink: {
        color: '#1976d2',
        fontWeight: 'bold',
    },
}); 