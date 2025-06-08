import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity,
    Image,
    Alert,
    TextInput,
    Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
    fetchTradeOfferById, 
    acceptTradeOffer, 
    rejectTradeOffer, 
    cancelTradeOffer, 
    completeTradeOffer 
} from '../features/trades/tradesThunks';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import { CustomButton } from '../components/common/CustomButton';
import TradeChatModal from '../components/chat/TradeChatModal';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TradeDetailParams {
    offerId: number;
}

const TradeDetailPage = () => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { offerId } = route.params as TradeDetailParams;
    
    const { currentOffer, loading, error, actionLoading } = useAppSelector((state) => state.trades);
    const { user } = useAppSelector((state) => state.auth);
    
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [comment, setComment] = useState('');
    const [actionType, setActionType] = useState<'accept' | 'reject' | 'cancel' | 'complete' | null>(null);
    const [showChatModal, setShowChatModal] = useState(false);

    useEffect(() => {
        if (offerId) {
            dispatch(fetchTradeOfferById(offerId));
        }
    }, [offerId, dispatch]);

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleOpenChat = () => {
        setShowChatModal(true);
    };

    const getStatusColor = (statusName: string) => {
        switch (statusName) {
            case 'pending': return '#ffc107';
            case 'accepted': return '#28a745';
            case 'rejected': return '#dc3545';
            case 'completed': return '#17a2b8';
            case 'cancelled': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const getStatusIcon = (statusName: string) => {
        switch (statusName) {
            case 'pending': return 'schedule';
            case 'accepted': return 'check-circle';
            case 'rejected': return 'cancel';
            case 'completed': return 'done-all';
            case 'cancelled': return 'block';
            default: return 'help';
        }
    };

    const handleAction = (type: 'accept' | 'reject' | 'cancel' | 'complete') => {
        setActionType(type);
        setComment('');
        setShowCommentModal(true);
    };

    const executeAction = async () => {
        if (!actionType || !currentOffer) return;

        try {
            const data = comment ? { comment } : {};
            
            switch (actionType) {
                case 'accept':
                    await dispatch(acceptTradeOffer({ offerId: currentOffer.id, data })).unwrap();
                    Alert.alert('Успех', 'Предложение принято');
                    break;
                case 'reject':
                    await dispatch(rejectTradeOffer({ offerId: currentOffer.id, data })).unwrap();
                    Alert.alert('Успех', 'Предложение отклонено');
                    break;
                case 'cancel':
                    await dispatch(cancelTradeOffer({ offerId: currentOffer.id, data })).unwrap();
                    Alert.alert('Успех', 'Предложение отменено');
                    break;
                case 'complete':
                    await dispatch(completeTradeOffer({ offerId: currentOffer.id, data })).unwrap();
                    Alert.alert('Успех', 'Обмен завершен');
                    break;
            }
            
            setShowCommentModal(false);
            setActionType(null);
        } catch (error: any) {
            Alert.alert('Ошибка', error || 'Не удалось выполнить действие');
        }
    };

    const renderItemsList = (items: any[], title: string) => (
        <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.itemsList}>
                {items.map((item) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={styles.itemCard}
                        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
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
                        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                        {item.estimated_value && (
                            <Text style={styles.itemPrice}>{item.estimated_value} ₽</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderUserInfo = (user: any, label: string) => (
        <TouchableOpacity 
            style={styles.userContainer}
            onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
        >
            <Text style={styles.userLabel}>{label}</Text>
            <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                    {user.avatar_url ? (
                        <Image 
                            source={{ uri: user.avatar_url }} 
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Icon name="person" size={20} color="#666" />
                        </View>
                    )}
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                        {user.full_name || user.username}
                    </Text>
                    <View style={styles.userStats}>
                        {user.rating !== undefined && user.rating !== null && (
                            <View style={styles.userRating}>
                                <Icon name="star" size={14} color="#FFD700" />
                                <Text style={styles.userRatingText}>
                                    {parseFloat(user.rating.toString()).toFixed(1)}
                                </Text>
                            </View>
                        )}
                        {user.successful_trades !== undefined && user.successful_trades !== null && (
                            <View style={styles.userTrades}>
                                <Icon name="swap-horiz" size={14} color="#4CAF50" />
                                <Text style={styles.userTradesText}>
                                    {user.successful_trades} обменов
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <Icon name="chevron-right" size={20} color="#666" />
            </View>
        </TouchableOpacity>
    );

    if (loading && !currentOffer) {
        return <Loading fullscreen text="Загрузка обмена..." />;
    }

    if (error) {
        return (
            <Error 
                message={error} 
                onRetry={() => dispatch(fetchTradeOfferById(offerId))} 
                fullscreen 
            />
        );
    }

    if (!currentOffer) {
        return <Error message="Обмен не найден" fullscreen />;
    }

    const isInitiator = currentOffer.initiator.id === user?.id;
    const canAccept = !isInitiator && currentOffer.status.name === 'pending';
    const canReject = !isInitiator && currentOffer.status.name === 'pending';
    const canCancel = isInitiator && currentOffer.status.name === 'pending';
    const canComplete = currentOffer.status.name === 'accepted';

    return (
        <View style={styles.container}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Детали обмена</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content}>
                {/* Статус */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentOffer.status.name) }]}>
                        <Icon 
                            name={getStatusIcon(currentOffer.status.name)} 
                            size={16} 
                            color="white" 
                            style={styles.statusIcon}
                        />
                        <Text style={styles.statusText}>{currentOffer.status.description}</Text>
                    </View>
                    <Text style={styles.dateText}>
                        Создано: {new Date(currentOffer.created_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                {/* Участники */}
                <View style={styles.section}>
                    {renderUserInfo(currentOffer.initiator, 'Инициатор')}
                    {renderUserInfo(currentOffer.receiver, 'Получатель')}
                </View>

                {/* Адрес встречи */}
                {currentOffer.location_details && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Адрес встречи</Text>
                        <View style={styles.locationContainer}>
                            <Icon name="location-on" size={20} color="#4CAF50" />
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationTitle}>{currentOffer.location_details.title}</Text>
                                <Text style={styles.locationAddress}>
                                    {currentOffer.location_details.city}, {currentOffer.location_details.address}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Сообщение */}
                {currentOffer.message && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Сообщение</Text>
                        <View style={styles.messageContainer}>
                            <Text style={styles.messageText}>{currentOffer.message}</Text>
                        </View>
                    </View>
                )}

                {/* Предметы обмена */}
                <View style={styles.section}>
                    {renderItemsList(
                        currentOffer.initiator_items, 
                        `Предметы ${currentOffer.initiator.full_name || currentOffer.initiator.username}`
                    )}
                    
                    <View style={styles.exchangeArrow}>
                        <Icon name="swap-vert" size={32} color="#1976d2" />
                    </View>
                    
                    {renderItemsList(
                        currentOffer.receiver_items, 
                        `Предметы ${currentOffer.receiver.full_name || currentOffer.receiver.username}`
                    )}
                </View>

                {/* Действия */}
                <View style={styles.actionsContainer}>
                    {/* Кнопка чата */}
                    <CustomButton
                        mode="outlined"
                        label="Открыть чат"
                        onPress={handleOpenChat}
                        style={[styles.actionButton, styles.chatButton]}
                        icon="chat"
                    />
                    
                    {canAccept && (
                        <CustomButton
                            mode="contained"
                            label="Принять предложение"
                            onPress={() => handleAction('accept')}
                            style={[styles.actionButton, styles.acceptButton]}
                            loading={actionLoading}
                        />
                    )}
                    
                    {canReject && (
                        <CustomButton
                            mode="outlined"
                            label="Отклонить"
                            onPress={() => handleAction('reject')}
                            style={[styles.actionButton, styles.rejectButton]}
                            loading={actionLoading}
                        />
                    )}
                    
                    {canCancel && (
                        <CustomButton
                            mode="outlined"
                            label="Отменить предложение"
                            onPress={() => handleAction('cancel')}
                            style={[styles.actionButton, styles.cancelButton]}
                            loading={actionLoading}
                        />
                    )}
                    
                    {canComplete && (
                        <CustomButton
                            mode="contained"
                            label="Завершить обмен"
                            onPress={() => handleAction('complete')}
                            style={[styles.actionButton, styles.completeButton]}
                            loading={actionLoading}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Модальное окно для комментария */}
            <Modal
                visible={showCommentModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCommentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {actionType === 'accept' && 'Принять предложение'}
                            {actionType === 'reject' && 'Отклонить предложение'}
                            {actionType === 'cancel' && 'Отменить предложение'}
                            {actionType === 'complete' && 'Завершить обмен'}
                        </Text>
                        
                        <Text style={styles.modalSubtitle}>
                            Добавьте комментарий (необязательно):
                        </Text>
                        
                        <TextInput
                            style={styles.commentInput}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Ваш комментарий..."
                            multiline
                            numberOfLines={3}
                        />
                        
                        <View style={styles.modalActions}>
                            <CustomButton
                                mode="outlined"
                                label="Отмена"
                                onPress={() => setShowCommentModal(false)}
                                style={styles.modalButton}
                            />
                            <CustomButton
                                mode="contained"
                                label="Подтвердить"
                                onPress={executeAction}
                                style={styles.modalButton}
                                loading={actionLoading}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Модальное окно чата */}
            {currentOffer && user && (
                <TradeChatModal
                    visible={showChatModal}
                    onClose={() => setShowChatModal(false)}
                    tradeOfferId={currentOffer.id}
                    initiator={currentOffer.initiator}
                    receiver={currentOffer.receiver}
                    currentUser={user}
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
    statusContainer: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 8,
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 8,
    },
    statusIcon: {
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    dateText: {
        fontSize: 12,
        color: '#666',
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
    userContainer: {
        marginBottom: 16,
    },
    userLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        marginRight: 12,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    userStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        flexWrap: 'wrap',
    },
    userRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    userRatingText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    userTrades: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userTradesText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    messageContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
    },
    messageText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    itemsSection: {
        marginBottom: 16,
    },
    itemsList: {
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
    exchangeArrow: {
        alignItems: 'center',
        marginVertical: 8,
    },
    actionsContainer: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 16,
    },
    actionButton: {
        marginBottom: 8,
    },
    acceptButton: {
        backgroundColor: '#28a745',
    },
    rejectButton: {
        borderColor: '#dc3545',
    },
    cancelButton: {
        borderColor: '#6c757d',
    },
    completeButton: {
        backgroundColor: '#17a2b8',
    },
    chatButton: {
        borderColor: '#1976d2',
        backgroundColor: 'transparent',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
        marginBottom: 16,
        minHeight: 80,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationInfo: {
        flex: 1,
        marginLeft: 12,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
    },
});

export default TradeDetailPage; 