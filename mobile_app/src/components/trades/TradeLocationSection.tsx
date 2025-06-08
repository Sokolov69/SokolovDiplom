import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UserLocation } from '../../types/profile';

interface TradeLocationSectionProps {
    selectedLocation: UserLocation | null;
    onLocationPress: () => void;
    label?: string;
    description?: string;
}

const TradeLocationSection: React.FC<TradeLocationSectionProps> = ({
    selectedLocation,
    onLocationPress,
    label = "Адрес встречи",
    description = "Выберите адрес для встречи (необязательно)"
}) => {
    return (
        <View style={styles.section}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.description}>{description}</Text>
            
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
                            <Text style={styles.placeholderText}>Выбрать адрес встречи</Text>
                        )}
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#666" />
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    selector: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: 'white',
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
    },
    selectedAddress: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    placeholderText: {
        fontSize: 16,
        color: '#999',
    },
});

export default TradeLocationSection; 