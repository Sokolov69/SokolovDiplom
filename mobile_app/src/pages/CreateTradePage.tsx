import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity,
    Image,
    TextInput,
    Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMyItems } from '../features/items/itemsThunks';
import { createTradeOffer } from '../features/trades/tradesThunks';
import { tradeService } from '../services/tradeService';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import { CustomButton } from '../components/common/CustomButton';
import TradeLocationSection from '../components/trades/TradeLocationSection';
import TradeLocationSelectDialog from '../components/trades/TradeLocationSelectDialog';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ParticipantLocations } from '../types/trade';
import { UserLocation } from '../types/profile';

interface CreateTradeParams {
    receiverId?: number;
    receiverItemId?: number;
}

const CreateTradePage = () => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const route = useRoute();
    const params = route.params as CreateTradeParams;
    
    const { myItems, loading, error } = useAppSelector((state) => state.items);
    const { loading: tradeLoading } = useAppSelector((state) => state.trades);
    const { user } = useAppSelector((state) => state.auth);
    
    const [selectedMyItems, setSelectedMyItems] = useState<number[]>([]);
    const [selectedTheirItems, setSelectedTheirItems] = useState<number[]>([]);
    const [message, setMessage] = useState('');
    const [receiverId, setReceiverId] = useState<number | null>(params?.receiverId || null);
    
    // Состояния для адресов
    const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>(null);
    const [participantLocations, setParticipantLocations] = useState<ParticipantLocations>({
        initiator_locations: [],
        receiver_locations: []
    });
    const [showLocationDialog, setShowLocationDialog] = useState(false);
    const [loadingLocations, setLoadingLocations] = useState(false);

    useEffect(() => {
        // Загружаем мои предметы
        dispatch(fetchMyItems());
        
        // Если передан ID предмета получателя, добавляем его в выбранные
        if (params?.receiverItemId) {
            setSelectedTheirItems([params.receiverItemId]);
        }
    }, [dispatch, params]);

    // Загрузка адресов участников
    const loadParticipantLocations = async (targetReceiverId: number) => {
        setLoadingLocations(true);
        try {
            const locations = await tradeService.getParticipantLocations(targetReceiverId);
            setParticipantLocations(locations);
        } catch (error: any) {
            console.error('Ошибка загрузки адресов участников:', error);
            // Не показываем Alert, так как адреса необязательны
        } finally {
            setLoadingLocations(false);
        }
    };

    // Загружаем адреса когда receiverId становится доступен
    useEffect(() => {
        if (receiverId) {
            loadParticipantLocations(receiverId);
        }
    }, [receiverId]);

    const handleGoBack = () => {
        navigation.goBack();
    };

    const toggleMyItem = (itemId: number) => {
        setSelectedMyItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleLocationPress = () => {
        if (!receiverId) {
            Alert.alert('Информация', 'Сначала выберите получателя обмена');
            return;
        }
        setShowLocationDialog(true);
    };

    const handleLocationSelect = (location: UserLocation | null) => {
        setSelectedLocation(location);
    };

    const handleCreateOffer = async () => {
        if (!receiverId) {
            Alert.alert('Ошибка', 'Не указан получатель обмена');
            return;
        }

        if (selectedMyItems.length === 0) {
            Alert.alert('Ошибка', 'Выберите хотя бы один свой предмет для обмена');
            return;
        }

        if (selectedTheirItems.length === 0) {
            Alert.alert('Ошибка', 'Выберите хотя бы один предмет для получения');
            return;
        }

        try {
            const offerData = {
                receiver_id: receiverId,
                location: selectedLocation?.id,
                message: message.trim() || undefined,
                initiator_items: selectedMyItems,
                receiver_items: selectedTheirItems,
            };

            const result = await dispatch(createTradeOffer(offerData)).unwrap();
            
            Alert.alert(
                'Успех', 
                'Предложение обмена отправлено!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.navigate('TradeDetail', { offerId: result.id });
                        }
                    }
                ]
            );
        } catch (error: any) {
            Alert.alert('Ошибка', error || 'Не удалось создать предложение обмена');
        }
    };

    const renderItemCard = (item: any, isSelected: boolean, onPress: () => void) => (
        <TouchableOpacity 
            key={item.id}
            style={[styles.itemCard, isSelected && styles.selectedItemCard]}
            onPress={onPress}
        >
            {item.primary_image ? (
                <Image 
                    source={{ uri: item.primary_image }} 
                    style={styles.itemImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.itemImagePlaceholder}>
                    <Icon name="image" size={24} color="#ccc" />
                </View>
            )}
            
            <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                {item.estimated_value && (
                    <Text style={styles.itemPrice}>{item.estimated_value} ₽</Text>
                )}
            </View>
            
            {isSelected && (
                <View style={styles.selectedIndicator}>
                    <Icon name="check-circle" size={20} color="#1976d2" />
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading && myItems.length === 0) {
        return <Loading fullscreen text="Загрузка предметов..." />;
    }

    if (error) {
        return (
            <Error 
                message={error} 
                onRetry={() => dispatch(fetchMyItems())} 
                fullscreen 
            />
        );
    }

    return (
        <View style={styles.container}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Создать обмен</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content}>
                {/* Информация о получателе */}
                {!receiverId && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Получатель</Text>
                        <Text style={styles.infoText}>
                            Для создания обмена перейдите на страницу товара и нажмите "Предложить обмен"
                        </Text>
                    </View>
                )}

                {/* Мои предметы */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Мои предметы для обмена ({selectedMyItems.length} выбрано)
                    </Text>
                    
                    {myItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="inventory" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>У вас нет предметов для обмена</Text>
                            <CustomButton
                                mode="outlined"
                                label="Добавить предмет"
                                onPress={() => navigation.navigate('CreateItem')}
                                style={styles.emptyButton}
                            />
                        </View>
                    ) : (
                        <View style={styles.itemsGrid}>
                            {myItems.map((item) => 
                                renderItemCard(
                                    item,
                                    selectedMyItems.includes(item.id),
                                    () => toggleMyItem(item.id)
                                )
                            )}
                        </View>
                    )}
                </View>

                {/* Адрес встречи */}
                {receiverId && (
                    <View style={styles.section}>
                        <TradeLocationSection
                            selectedLocation={selectedLocation}
                            onLocationPress={handleLocationPress}
                        />
                    </View>
                )}

                {/* Сообщение */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Сообщение (необязательно)</Text>
                    <TextInput
                        style={styles.messageInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Добавьте сообщение к вашему предложению..."
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                    />
                    <Text style={styles.characterCount}>{message.length}/500</Text>
                </View>

                {/* Кнопка создания */}
                <View style={styles.actionsContainer}>
                    <CustomButton
                        mode="contained"
                        label="Отправить предложение"
                        onPress={handleCreateOffer}
                        loading={tradeLoading}
                        disabled={!receiverId || selectedMyItems.length === 0 || selectedTheirItems.length === 0}
                        style={styles.createButton}
                    />
                </View>
            </ScrollView>
            
            {/* Диалог выбора адреса */}
            {receiverId && (
                <TradeLocationSelectDialog
                    visible={showLocationDialog}
                    onDismiss={() => setShowLocationDialog(false)}
                    locations={participantLocations}
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                    initiatorName={user?.username || 'Вы'}
                    receiverName="Получатель" // TODO: получить имя получателя
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: 'white',
        marginBottom: 8,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    itemCard: {
        width: '48%',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 8,
        margin: 4,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    selectedItemCard: {
        borderColor: '#1976d2',
        backgroundColor: '#e3f2fd',
    },
    itemImage: {
        width: '100%',
        height: 80,
        borderRadius: 6,
        marginBottom: 8,
    },
    itemImagePlaceholder: {
        width: '100%',
        height: 80,
        backgroundColor: '#e0e0e0',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    selectedIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 2,
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    characterCount: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyButton: {
        minWidth: 150,
    },
    actionsContainer: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 16,
    },
    createButton: {
        marginTop: 8,
    },
});

export default CreateTradePage; 