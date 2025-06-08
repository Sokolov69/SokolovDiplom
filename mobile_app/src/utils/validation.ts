export interface ValidationErrors {
    [key: string]: string[];
}

export interface FormField {
    name: string;
    value: string;
}

// Список часто используемых паролей (упрощенная версия)
const COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    '111111', '123123', 'admin', 'letmein', 'welcome', '1234567890',
    '12345678', '1234567', '123', '1234', '12345', '654321', 'superman',
    'qazwsx', 'michael', 'football', 'baseball', 'liverpool', 'dragon',
    'monkey', 'chicken', 'master', 'sunshine', 'shadow', 'daniel',
    '147852369', '987654321', '159753', '147258369', '741852963'
];

export const validateUsername = (value: string): string[] => {
    const errors: string[] = [];
    
    if (!value) {
        errors.push('Имя пользователя обязательно');
        return errors;
    }
    
    if (value.length < 3) {
        errors.push('Имя пользователя должно содержать минимум 3 символа');
    }
    
    if (value.length > 150) {
        errors.push('Имя пользователя не может быть длиннее 150 символов');
    }
    
    // Проверка на допустимые символы (буквы, цифры, @/./+/-/_)
    const usernameRegex = /^[\w.@+-]+$/;
    if (!usernameRegex.test(value)) {
        errors.push('Имя пользователя может содержать только буквы, цифры и символы @/./+/-/_');
    }
    
    return errors;
};

export const validateEmail = (value: string): string[] => {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!value) {
        errors.push('Email обязателен');
    } else if (!emailRegex.test(value)) {
        errors.push('Пожалуйста, введите корректный email');
    } else if (value.length > 254) {
        errors.push('Email не может быть длиннее 254 символов');
    }
    
    return errors;
};

export const validatePassword = (value: string, username?: string): string[] => {
    const errors: string[] = [];
    
    if (!value) {
        errors.push('Пароль обязателен');
        return errors;
    }
    
    // Минимальная длина
    if (value.length < 8) {
        errors.push('Пароль должен содержать минимум 8 символов');
    }
    
    // Проверка на совпадение с именем пользователя
    if (username && value.toLowerCase() === username.toLowerCase()) {
        errors.push('Пароль не может совпадать с именем пользователя');
    }
    
    // Проверка на часто используемые пароли
    if (COMMON_PASSWORDS.includes(value.toLowerCase())) {
        errors.push('Введённый пароль слишком широко распространён');
    }
    
    // Проверка на числовой пароль
    if (/^\d+$/.test(value)) {
        errors.push('Введённый пароль состоит только из цифр');
    }
    
    // Проверка на слишком простой пароль (только буквы или только цифры)
    if (/^[a-zA-Z]+$/.test(value)) {
        errors.push('Пароль слишком простой - используйте комбинацию букв, цифр и символов');
    }
    
    // Проверка на сходство с личными данными (если есть username)
    if (username && username.length > 3) {
        const usernameLower = username.toLowerCase();
        const passwordLower = value.toLowerCase();
        
        // Проверяем, содержит ли пароль значительную часть имени пользователя
        if (usernameLower.length >= 4 && passwordLower.includes(usernameLower.substring(0, 4))) {
            errors.push('Пароль слишком похож на имя пользователя');
        }
    }
    
    return errors;
};

export const validatePasswordConfirmation = (value: string, password: string): string[] => {
    const errors: string[] = [];
    
    if (!value) {
        errors.push('Подтверждение пароля обязательно');
        return errors;
    }
    
    if (value !== password) {
        errors.push('Пароли не совпадают');
    }
    
    return errors;
};

// Функция для проверки, есть ли ошибки в форме
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
    return Object.values(errors).some(fieldErrors => fieldErrors.length > 0);
};

// Функция для проверки, заполнены ли все обязательные поля
export const areRequiredFieldsFilled = (values: Record<string, string>, requiredFields: string[]): boolean => {
    return requiredFields.every(field => values[field] && values[field].trim().length > 0);
}; 