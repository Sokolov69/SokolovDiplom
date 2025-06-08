import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Divider, Button } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UserLocation } from '../../types/profile';
import { ParticipantLocations } from '../../types/trade';

interface TradeLocationSelectDialogProps {
    visible: boolean;
    onDismiss: () => void;
    locations: ParticipantLocations;
    onLocationSelect: (location: UserLocation | null) => void;
    selectedLocation: UserLocation | null;
    initiatorName: string;
    receiverName: string;
}

const TradeLocationSelectDialog: React.FC<TradeLocationSelectDialogProps> = ({
    visible,
    onDismiss,
    locations,
    onLocationSelect,
    selectedLocation,
    initiatorName,
    receiverName
}) => {
    const handleLocationSelect = (location: UserLocation | null) => {
        onLocationSelect(location);
        onDismiss();
    };

    const renderLocationItem = (location: UserLocation, isSelected: boolean) => (
        <TouchableOpacity
            key={location.id}
            style={[styles.locationItem, isSelected && styles.selectedLocationItem]}
            onPress={() => handleLocationSelect(location)}
        >
            <MaterialIcons 
                name="location-on" 
                size={20} 
                color={isSelected ? "#4CAF50" : "#666"} 
            />
            <View style={styles.locationInfo}>
                <Text style={[styles.locationTitle, isSelected && styles.selectedText]}>
                    {location.title}
                </Text>
                <Text style={styles.locationAddress}>
                    {location.city}, {location.address}
                </Text>
            </View>
            {isSelected && (
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            )}
        </TouchableOpacity>
    );

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
                <Dialog.Title style={styles.title}>Выбор адреса встречи</Dialog.Title>
                
                <Dialog.Content>
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* Опция "Без адреса" */}
                        <TouchableOpacity
                            style={[styles.locationItem, !selectedLocation && styles.selectedLocationItem]}
                            onPress={() => handleLocationSelect(null)}
                        >
                            <MaterialIcons 
                                name="location-off" 
                                size={20} 
                                color={!selectedLocation ? "#4CAF50" : "#666"} 
                            />
                            <View style={styles.locationInfo}>
                                <Text style={[styles.locationTitle, !selectedLocation && styles.selectedText]}>
                                    Без адреса
                                </Text>
                                <Text style={styles.locationAddress}>
                                    Адрес будет определен позже
                                </Text>
                            </View>
                            {!selectedLocation && (
                                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                            )}
                        </TouchableOpacity>

                        <Divider style={styles.divider} />

                        {/* Адреса инициатора */}
                        {locations.initiator_locations.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Адреса {initiatorName}</Text>
                                {locations.initiator_locations.map(location => 
                                    renderLocationItem(location, selectedLocation?.id === location.id)
                                )}
                                <Divider style={styles.divider} />
                            </>
                        )}

                        {/* Адреса получателя */}
                        {locations.receiver_locations.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Адреса {receiverName}</Text>
                                {locations.receiver_locations.map(location => 
                                    renderLocationItem(location, selectedLocation?.id === location.id)
                                )}
                            </>
                        )}

                        {/* Сообщение если нет адресов */}
                        {locations.initiator_locations.length === 0 && locations.receiver_locations.length === 0 && (
                            <View style={styles.emptyState}>
                                <MaterialIcons name="location-off" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>У участников нет сохраненных адресов</Text>
                                <Text style={styles.emptySubText}>Вы можете добавить адреса в настройках профиля</Text>
                            </View>
                        )}
                    </ScrollView>
                </Dialog.Content>

                <Dialog.Actions>
                    <Button onPress={onDismiss}>Отмена</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: {
        maxHeight: '80%',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scrollView: {
        maxHeight: 400,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginVertical: 12,
        marginLeft: 4,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginVertical: 2,
    },
    selectedLocationItem: {
        backgroundColor: '#e8f5e8',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    locationInfo: {
        flex: 1,
        marginLeft: 12,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    selectedText: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    divider: {
        marginVertical: 8,
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 4,
    },
});

export default TradeLocationSelectDialog; 