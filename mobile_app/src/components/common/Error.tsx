import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ErrorProps {
    message: string;
    onRetry?: () => void;
    fullscreen?: boolean;
    details?: string;
}

export const Error: React.FC<ErrorProps> = ({ 
    message, 
    onRetry,
    fullscreen = false,
    details
}) => {
    const containerStyle = fullscreen 
        ? styles.fullscreenContainer 
        : styles.container;

    return (
        <View style={containerStyle}>
            <Icon name="error-outline" size={40} color="#e53935" />
            <Text style={styles.text}>{message}</Text>
            
            {details && (
                <ScrollView style={styles.detailsContainer}>
                    <Text style={styles.detailsText}>{details}</Text>
                </ScrollView>
            )}
            
            {onRetry && (
                <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={onRetry}
                >
                    <Text style={styles.retryText}>Повторить</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#ffebee',
        borderRadius: 8,
        margin: 10,
    },
    fullscreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    text: {
        marginTop: 10,
        fontSize: 16,
        color: '#e53935',
        textAlign: 'center',
    },
    detailsContainer: {
        maxHeight: 150,
        width: '100%',
        marginTop: 10,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 4,
        padding: 10,
    },
    detailsText: {
        fontSize: 12,
        color: '#666',
    },
    retryButton: {
        marginTop: 15,
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: '#e53935',
        borderRadius: 4,
    },
    retryText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
}); 