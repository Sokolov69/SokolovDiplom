import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

interface LoadingProps {
    size?: 'small' | 'large';
    color?: string;
    text?: string;
    fullscreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ 
    size = 'large', 
    color = '#1976d2', 
    text,
    fullscreen = false
}) => {
    const containerStyle = fullscreen 
        ? styles.fullscreenContainer 
        : styles.container;

    return (
        <View style={containerStyle}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.text}>{text}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
}); 