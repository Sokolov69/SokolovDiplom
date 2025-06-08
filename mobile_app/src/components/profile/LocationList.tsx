import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {Button} from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppSelector, useAppDispatch} from '../../store/hooks';
import {UserLocation} from '../../types/profile';
import {deleteLocation, updateLocation} from '../../features/profile/profileThunks';

interface LocationItemProps {
    location: UserLocation;
    onEdit: (location: UserLocation) => void;
    onDelete: (locationId: number) => void;
    onSetPrimary: (location: UserLocation) => void;
}

const LocationItem: React.FC<LocationItemProps> = ({location, onEdit, onDelete, onSetPrimary}) => {
    return (
        <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
                <View style={styles.titleContainer}>
                    <Text style={styles.locationTitle}>{location.title}</Text>
                    {location.is_primary && (
                        <View style={styles.primaryBadge}>
                            <Text style={styles.primaryText}>Основной</Text>
                        </View>
                    )}
                </View>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onEdit(location)}
                    >
                        <Icon name="edit" size={20} color="#1976d2"/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onDelete(location.id)}
                    >
                        <Icon name="delete" size={20} color="#d32f2f"/>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider}/>

            <View style={styles.addressContainer}>
                <Text style={styles.addressText}>{location.address}</Text>
                <Text style={styles.countryText}>
                    {location.city}, {location.region}, {location.country}
                </Text>
                {location.postal_code && (
                    <Text style={styles.countryText}>Индекс: {location.postal_code}</Text>
                )}
            </View>

            {!location.is_primary && (
                <Button
                    title="Сделать основным"
                    type="outline"
                    buttonStyle={styles.setPrimaryButton}
                    titleStyle={styles.setPrimaryButtonText}
                    onPress={() => onSetPrimary(location)}
                />
            )}
        </View>
    );
};

export const LocationList: React.FC<{ onAddLocation: () => void }> = ({onAddLocation}) => {
    const dispatch = useAppDispatch();
    const {locations, loading} = useAppSelector(state => state.profile);

    const handleEditLocation = (location: UserLocation) => {
        // Будет реализовано позже
        Alert.alert('Редактирование', 'Функция редактирования будет добавлена позже');
    };

    const handleDeleteLocation = (locationId: number) => {
        Alert.alert(
            'Подтверждение',
            'Вы действительно хотите удалить этот адрес?',
            [
                {text: 'Отмена', style: 'cancel'},
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        await dispatch(deleteLocation(locationId));
                    }
                }
            ]
        );
    };

    const handleSetPrimary = (location: UserLocation) => {
        dispatch(updateLocation({
            id: location.id,
            data: {...location, is_primary: true}
        }));
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.sectionTitle}>Мои адреса</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={onAddLocation}
                >
                    <Icon name="add-location" size={24} color="#1976d2"/>
                    <Text style={styles.addButtonText}>Добавить</Text>
                </TouchableOpacity>
            </View>

            {locations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="place" size={48} color="#cccccc"/>
                    <Text style={styles.emptyText}>У вас пока нет сохраненных адресов</Text>
                    <Button
                        title="Добавить адрес"
                        onPress={onAddLocation}
                        buttonStyle={styles.emptyButton}
                    />
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                >
                    {locations.map((location) => (
                        <LocationItem
                            key={location.id}
                            location={location}
                            onEdit={handleEditLocation}
                            onDelete={handleDeleteLocation}
                            onSetPrimary={handleSetPrimary}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
    },
    addButtonText: {
        color: '#1976d2',
        marginLeft: 5,
        fontSize: 14,
    },
    list: {
        width: '100%',
    },
    locationCard: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    locationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    primaryBadge: {
        backgroundColor: '#1976d2',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    primaryText: {
        color: 'white',
        fontSize: 12,
    },
    actionsContainer: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 5,
        marginLeft: 5,
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 8,
    },
    addressContainer: {
        marginBottom: 8,
    },
    addressText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 2,
    },
    countryText: {
        fontSize: 14,
        color: '#777',
    },
    setPrimaryButton: {
        borderColor: '#1976d2',
        borderRadius: 5,
        marginTop: 5,
    },
    setPrimaryButtonText: {
        color: '#1976d2',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginHorizontal: 10,
    },
    emptyText: {
        fontSize: 16,
        color: '#777',
        marginVertical: 10,
        textAlign: 'center',
    },
    emptyButton: {
        backgroundColor: '#1976d2',
        paddingHorizontal: 20,
        marginTop: 10,
    },
}); 