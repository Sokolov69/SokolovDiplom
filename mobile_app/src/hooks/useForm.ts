import { useState, useCallback, useMemo } from 'react';
import { ValidationErrors, hasValidationErrors, areRequiredFieldsFilled } from '../utils/validation';

// Обновленный интерфейс, который может работать с более гибкими типами данных
interface UseFormProps<T> {
    initialValues: T;
    validateField?: (name: keyof T, value: string) => string[];
    requiredFields?: (keyof T)[];
    onSubmit: (values: T) => Promise<void>;
}

export const useForm = <T extends Record<string, any>>({
    initialValues,
    validateField,
    requiredFields,
    onSubmit,
}: UseFormProps<T>) => {
    const [values, setValues] = useState<T>(initialValues);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((name: keyof T, value: string) => {
        setValues((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (validateField) {
            const errors = validateField(name, value);
            setValidationErrors((prev) => ({
                ...prev,
                [name]: errors,
            }));
        }
    }, [validateField]);

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [onSubmit, values]);

    const getFieldError = useCallback((fieldName: keyof T) => {
        const error = validationErrors[fieldName as string]?.[0];
        console.log(`getFieldError для поля ${String(fieldName)}:`, error);
        return error;
    }, [validationErrors]);

    const clearErrors = useCallback(() => {
        setValidationErrors({});
    }, []);

    // Обертка для setValidationErrors с логированием
    const setValidationErrorsWithLogging = useCallback((errors: ValidationErrors) => {
        console.log('=== setValidationErrors вызван ===');
        console.log('Новые ошибки:', errors);
        console.log('Устанавливаем ошибки...');
        setValidationErrors(errors);
        console.log('setValidationErrors завершен');
    }, []);

    const isFormValid = useMemo(() => {
        if (requiredFields) {
            return requiredFields.every(field => values[field] !== undefined && values[field] !== null && values[field] !== '');
        }
        return true;
    }, [values, requiredFields]);

    return {
        values,
        validationErrors,
        isSubmitting,
        handleChange,
        handleSubmit,
        getFieldError,
        clearErrors,
        setValidationErrors: setValidationErrorsWithLogging,
        isFormValid,
    };
}; 