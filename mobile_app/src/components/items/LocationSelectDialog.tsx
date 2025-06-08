import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { UserLocation } from '../../types/profile';

interface LocationSelectDialogProps {
    visible: boolean;
    onDismiss: () => void;
    locations: UserLocation[];
    selectedLocation: number | null;
    onLocationSelect: (locationId: number | null) => void;
}

const LocationSelectDialog: React.FC<LocationSelectDialogProps> = ({
    visible,
    onDismiss,
    locations,
    selectedLocation,
    onLocationSelect
}) => {
    const handleLocationSelect = (locationId: number | null) => {
        onLocationSelect(locationId);
        onDismiss();
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modal}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Выберите адрес</Text>
                    <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                        <MaterialIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* Опция "Без адреса" */}
                    <TouchableOpacity 
                        style={[
                            styles.locationItem,
                            selectedLocation === null && styles.selectedItem
                        ]}
                        onPress={() => handleLocationSelect(null)}
                    >
                        <MaterialIcons 
                            name="location-off" 
                            size={24} 
                            color={selectedLocation === null ? "#4CAF50" : "#666"} 
                        />
                        <View style={styles.locationContent}>
                            <Text style={[
                                styles.locationTitle,
                                selectedLocation === null && styles.selectedText
                            ]}>
                                Без указания адреса
                            </Text>
                            <Text style={styles.locationDescription}>
                                Адрес можно будет обсудить при связи с владельцем
                            </Text>
                        </View>
                        {selectedLocation === null && (
                            <MaterialIcons name="check" size={24} color="#4CAF50" />
                        )}
                    </TouchableOpacity>

                    {locations.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="location-off" size={48} color="#ccc" />
                            <Text style={styles.emptyTitle}>Нет сохраненных адресов</Text>
                            <Text style={styles.emptyDescription}>
                                Добавьте адреса в разделе "Профиль", чтобы их можно было выбрать для товаров
                            </Text>
                        </View>
                    ) : (
                        locations.map((location) => (
                            <TouchableOpacity 
                                key={location.id}
                                style={[
                                    styles.locationItem,
                                    selectedLocation === location.id && styles.selectedItem
                                ]}
                                onPress={() => handleLocationSelect(location.id)}
                            >
                                <MaterialIcons 
                                    name="location-on" 
                                    size={24} 
                                    color={selectedLocation === location.id ? "#4CAF50" : "#666"} 
                                />
                                <View style={styles.locationContent}>
                                    <View style={styles.locationHeader}>
                                        <Text style={[
                                            styles.locationTitle,
                                            selectedLocation === location.id && styles.selectedText
                                        ]}>
                                            {location.title}
                                        </Text>
                                        {location.is_primary && (
                                            <View style={styles.primaryBadge}>
                                                <Text style={styles.primaryText}>Основной</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.locationAddress}>
                                        {location.city}, {location.address}
                                    </Text>
                                    {location.region && (
                                        <Text style={styles.locationRegion}>
                                            {location.region}
                                        </Text>
                                    )}
                                </View>
                                {selectedLocation === location.id && (
                                    <MaterialIcons name="check" size={24} color="#4CAF50" />
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modal: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 12,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        maxHeight: 400,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedItem: {
        backgroundColor: '#f8f9fa',
        borderBottomColor: '#4CAF50',
    },
    locationContent: {
        flex: 1,
        marginLeft: 12,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    selectedText: {
        color: '#4CAF50',
    },
    primaryBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    primaryText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    locationRegion: {
        fontSize: 12,
        color: '#999',
    },
    locationDescription: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default LocationSelectDialog; 