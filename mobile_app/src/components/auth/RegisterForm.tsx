import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register } from '../../features/auth/authThunks';
import { setValidationErrors as setReduxValidationErrors } from '../../features/auth/authSlice';
import { FormContainer } from '../common/FormContainer';
import { PasswordField } from '../common/PasswordField';
import { RegisterData } from '../../types/auth';
import { useForm } from '../../hooks/useForm';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { validateUsername, validatePassword, validatePasswordConfirmation, validateEmail } from '../../utils/validation';

type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Компонент для отображения требований к паролю
const PasswordRequirements: React.FC<{ password: string; username: string }> = ({ password, username }) => {
    const requirements = [
        { text: 'Минимум 8 символов', check: password.length >= 8 },
        { text: 'Не состоит только из цифр', check: !/^\d+$/.test(password) },
        { text: 'Не является распространённым паролем', check: !['password', '123456', '123456789', 'qwerty', '147852369'].includes(password.toLowerCase()) },
        { text: 'Отличается от имени пользователя', check: password.toLowerCase() !== username.toLowerCase() },
    ];

    return (
        <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Требования к паролю:</Text>
            {requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                    <Text style={[styles.requirementText, req.check ? styles.requirementMet : styles.requirementNotMet]}>
                        {req.check ? '✓' : '✗'} {req.text}
                    </Text>
                </View>
            ))}
        </View>
    );
};

export const RegisterForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const { validationErrors: reduxValidationErrors } = useAppSelector((state) => state.auth);
    
    // Логирование монтирования/размонтирования
    useEffect(() => {
        console.log('🔵 RegisterForm МОНТИРОВАН');
        return () => {
            console.log('🔴 RegisterForm РАЗМОНТИРОВАН');
        };
    }, []);
    
    // Локальное состояние для ошибок сервера (оставляем для совместимости)
    const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
    
    // Отслеживание изменений serverErrors
    useEffect(() => {
        console.log('📝 serverErrors изменились:', serverErrors);
    }, [serverErrors]);
    
    // Отслеживание изменений reduxValidationErrors
    useEffect(() => {
        console.log('📝 reduxValidationErrors изменились:', reduxValidationErrors);
    }, [reduxValidationErrors]);

    const validateField = (name: keyof RegisterData, value: string): string[] => {
        switch (name) {
            case 'username':
                return validateUsername(value);
            case 'email':
                return validateEmail(value);
            case 'password':
                return validatePassword(value, values.username);
            case 'password2':
                return validatePasswordConfirmation(value, values.password);
            default:
                return [];
        }
    };

    const {
        values,
        validationErrors,
        isSubmitting,
        isFormValid,
        handleChange,
        handleSubmit,
        getFieldError,
        setValidationErrors,
    } = useForm<RegisterData>({
        initialValues: {
            username: '',
            email: '',
            password: '',
            password2: '',
            first_name: '',
            last_name: '',
        },
        requiredFields: ['username', 'email', 'password', 'password2'],
        validateField,
        onSubmit: async (formData) => {
            try {
                console.log('=== RegisterForm onSubmit начало ===');
                console.log('Данные формы:', formData);
                
                const result = await dispatch(register(formData));
                console.log('Результат dispatch:', result);
                console.log('Тип результата:', result.type);
                console.log('Payload результата:', result.payload);
                
                if (register.fulfilled.match(result)) {
                    console.log('Регистрация успешна, переходим на Home');
                    navigation.navigate('Home');
                } else {
                    console.log('Регистрация неуспешна, обрабатываем ошибки');
                    if (result.payload) {
                        console.log('Payload существует:', result.payload);
                        console.log('Тип payload:', typeof result.payload);
                        console.log('Является ли payload массивом:', Array.isArray(result.payload));
                        
                        // Проверяем, является ли payload объектом с ошибками полей
                        if (typeof result.payload === 'object' && !Array.isArray(result.payload)) {
                            console.log('Обрабатываем как ошибки полей');
                            // Преобразуем ошибки с сервера в формат для setServerErrors
                            const formattedErrors: Record<string, string[]> = {};
                            Object.entries(result.payload as Record<string, string[]>).forEach(([field, messages]) => {
                                console.log(`Обрабатываем поле ${field}:`, messages);
                                if (Array.isArray(messages)) {
                                    formattedErrors[field] = messages;
                                } else {
                                    formattedErrors[field] = [messages as string];
                                }
                            });
                            console.log('Форматированные ошибки:', formattedErrors);
                            setServerErrors(formattedErrors);
                            console.log('setServerErrors вызван');
                            
                            // Также устанавливаем в useForm для совместимости
                            setValidationErrors(formattedErrors);
                            console.log('setValidationErrors вызван');
                        } else {
                            // Если это общая ошибка, показываем её как ошибку формы
                            console.error('Общая ошибка регистрации:', result.payload);
                        }
                    } else {
                        console.log('Payload отсутствует');
                    }
                }
                console.log('=== RegisterForm onSubmit конец ===');
            } catch (error) {
                console.error('=== ОШИБКА В onSubmit ===');
                console.error('Ошибка:', error);
                console.error('Стек ошибки:', error instanceof Error ? error.stack : 'Нет стека');
                console.error('=== КОНЕЦ ОШИБКИ ===');
            }
        },
    });

    // Функция для очистки ошибок при изменении поля
    const clearFieldErrors = () => {
        // Очищаем ошибки из Redux
        if (reduxValidationErrors) {
            dispatch(setReduxValidationErrors({}));
        }
        
        // Очищаем локальные ошибки сервера
        if (Object.keys(serverErrors).length > 0) {
            setServerErrors({});
        }
    };

    // Обертка для handleChange с очисткой ошибок
    const handleFieldChange = (name: keyof RegisterData, value: string) => {
        handleChange(name, value);
        clearFieldErrors();
    };

    // Функция-адаптер для передачи в компонент PasswordField
    const handlePasswordChange = (name: string, value: string) => {
        handleFieldChange(name as keyof RegisterData, value);
    };

    // Функция для получения ошибок поля (проверяет Redux, serverErrors и useForm)
    const getFieldErrorWithServer = (fieldName: keyof RegisterData): string | undefined => {
        // Сначала проверяем ошибки из Redux
        const reduxError = reduxValidationErrors?.[fieldName]?.[0];
        if (reduxError) {
            console.log(`getFieldErrorWithServer для поля ${String(fieldName)} (Redux):`, reduxError);
            return reduxError;
        }
        
        // Затем проверяем ошибки сервера (локальные)
        const serverError = serverErrors[fieldName]?.[0];
        if (serverError) {
            console.log(`getFieldErrorWithServer для поля ${String(fieldName)} (сервер):`, serverError);
            return serverError;
        }
        
        // В конце проверяем ошибки валидации из useForm
        const formError = getFieldError(fieldName);
        if (formError) {
            console.log(`getFieldErrorWithServer для поля ${String(fieldName)} (форма):`, formError);
            return formError;
        }
        
        console.log(`getFieldErrorWithServer для поля ${String(fieldName)}:`, undefined);
        return undefined;
    };

    // Проверка, есть ли ошибки валидации в любом из источников
    const hasAnyValidationErrors = (): boolean => {
        const requiredFields: (keyof RegisterData)[] = ['username', 'email', 'password', 'password2'];
        
        // Проверяем ошибки из Redux
        if (reduxValidationErrors) {
            const hasReduxErrors = Object.keys(reduxValidationErrors).some(field => 
                reduxValidationErrors[field] && reduxValidationErrors[field].length > 0
            );
            if (hasReduxErrors) return true;
        }
        
        // Проверяем локальные ошибки сервера
        const hasServerErrors = Object.keys(serverErrors).some(field => 
            serverErrors[field] && serverErrors[field].length > 0
        );
        if (hasServerErrors) return true;
        
        // Проверяем ошибки валидации из useForm
        const hasFormErrors = requiredFields.some(field => getFieldError(field));
        if (hasFormErrors) return true;
        
        return false;
    };

    // Итоговая проверка валидности формы
    const isFormReadyToSubmit = isFormValid && !hasAnyValidationErrors() && !isSubmitting;

    // Логирование состояния ошибок при каждом рендере
    console.log('=== RegisterForm рендер ===');
    console.log('Текущие validationErrors (useForm):', validationErrors);
    console.log('Текущие reduxValidationErrors:', reduxValidationErrors);
    console.log('Текущие serverErrors:', serverErrors);
    console.log('isSubmitting:', isSubmitting);
    console.log('isFormValid:', isFormValid);
    console.log('hasAnyValidationErrors():', hasAnyValidationErrors());
    console.log('isFormReadyToSubmit:', isFormReadyToSubmit);

    return (
        <FormContainer title="Регистрация">
            <ScrollView style={styles.scrollView}>
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Имя пользователя
                            <Text style={styles.required}> *</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, getFieldErrorWithServer('username') && styles.errorInput]}
                            value={values.username}
                            onChangeText={(text) => handleFieldChange('username', text)}
                            placeholder="Введите имя пользователя"
                        />
                        {getFieldErrorWithServer('username') && (
                            <Text style={styles.errorText}>{getFieldErrorWithServer('username')}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Email
                            <Text style={styles.required}> *</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, getFieldErrorWithServer('email') && styles.errorInput]}
                            value={values.email}
                            onChangeText={(text) => handleFieldChange('email', text)}
                            placeholder="Введите email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {getFieldErrorWithServer('email') && (
                            <Text style={styles.errorText}>{getFieldErrorWithServer('email')}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Имя
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={values.first_name}
                            onChangeText={(text) => handleFieldChange('first_name', text)}
                            placeholder="Введите ваше имя (необязательно)"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Фамилия
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={values.last_name}
                            onChangeText={(text) => handleFieldChange('last_name', text)}
                            placeholder="Введите вашу фамилию (необязательно)"
                        />
                    </View>

                    <PasswordField
                        label="Пароль"
                        name="password"
                        value={values.password}
                        onChange={handlePasswordChange}
                        error={!!getFieldErrorWithServer('password')}
                        helperText={getFieldErrorWithServer('password')}
                        required
                    />
                    <PasswordField
                        label="Подтверждение пароля"
                        name="password2"
                        value={values.password2}
                        onChange={handlePasswordChange}
                        error={!!getFieldErrorWithServer('password2')}
                        helperText={getFieldErrorWithServer('password2')}
                        required
                    />
                    <PasswordRequirements password={values.password} username={values.username} />
                    <TouchableOpacity
                        style={[styles.button, !isFormReadyToSubmit && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={!isFormReadyToSubmit}
                    >
                        <Text style={styles.buttonText}>
                            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.loginText}>
                            Уже есть аккаунт?{' '}
                            <Text 
                                style={styles.loginLink}
                                onPress={() => navigation.navigate('Login')}
                            >
                                Войти
                            </Text>
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </FormContainer>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        width: '100%',
    },
    form: {
        width: '100%',
        paddingBottom: 20,
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
    loginLinkContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        color: '#666',
    },
    loginLink: {
        color: '#1976d2',
        fontWeight: 'bold',
    },
    passwordRequirements: {
        marginTop: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
    },
    requirementsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    requirementItem: {
        marginBottom: 8,
    },
    requirementText: {
        fontSize: 16,
    },
    requirementMet: {
        color: 'green',
    },
    requirementNotMet: {
        color: 'red',
    },
}); 