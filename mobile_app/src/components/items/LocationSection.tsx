import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserLocation } from '../../types/profile';

interface LocationSectionProps {
    location: number | null;
    locations: UserLocation[];
    onLocationPress: () => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
    location,
    locations,
    onLocationPress
}) => {
    const selectedLocation = location ? locations.find(loc => loc.id === location) : null;

    return (
        <View style={styles.section}>
            <Text style={styles.label}>Адрес для обмена</Text>
            <Text style={styles.description}>
                Выберите адрес, где можно встретиться для обмена (необязательно)
            </Text>
            
            <TouchableOpacity 
                style={styles.selector}
                onPress={onLocationPress}
            >
                <View style={styles.selectorContent}>
                    <MaterialIcons 
                        name="location-on" 
                        size={24} 
                        color={selectedLocation ? "#4CAF50" : "#666"} 
                    />
                    <View style={styles.textContainer}>
                        {selectedLocation ? (
                            <>
                                <Text style={styles.selectedTitle}>{selectedLocation.title}</Text>
                                <Text style={styles.selectedAddress}>
                                    {selectedLocation.city}, {selectedLocation.address}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.placeholder}>Выберите адрес (необязательно)</Text>
                        )}
                    </View>
                    <MaterialIcons name="keyboard-arrow-right" size={24} color="#666" />
                </View>
            </TouchableOpacity>
            
            {!selectedLocation && (
                <Text style={styles.hint}>
                    Вы можете добавить новые адреса в разделе "Профиль"
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginVertical: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    selector: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    selectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    selectedTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    selectedAddress: {
        fontSize: 14,
        color: '#666',
    },
    placeholder: {
        fontSize: 16,
        color: '#999',
    },
    hint: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic',
    },
});

export default LocationSection; 