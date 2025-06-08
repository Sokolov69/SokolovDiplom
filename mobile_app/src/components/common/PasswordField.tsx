import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PasswordFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    error?: boolean;
    helperText?: string;
    required?: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
    label,
    name,
    value,
    onChange,
    error,
    helperText,
    required = false,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {label}
                {required && <Text style={styles.required}> *</Text>}
            </Text>
            <View style={[styles.inputContainer, error && styles.errorInput]}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={(text) => onChange(name, text)}
                    secureTextEntry={!showPassword}
                    placeholder={label}
                />
                <TouchableOpacity onPress={handleClickShowPassword} style={styles.iconButton}>
                    <Icon
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        size={24}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>
            {error && helperText && (
                <Text style={styles.errorText}>{helperText}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
    },
    iconButton: {
        padding: 8,
    },
    errorInput: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
}); 