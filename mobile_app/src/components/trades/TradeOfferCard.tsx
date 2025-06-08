import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { TradeOffer } from '../../types/trade';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TradeOfferCardProps {
    offer: TradeOffer;
    currentUserId: number;
    onPress: (offer: TradeOffer) => void;
}

export const TradeOfferCard: React.FC<TradeOfferCardProps> = ({
    offer,
    currentUserId,
    onPress
}) => {
    const isInitiator = offer.initiator.id === currentUserId;
    const otherUser = isInitiator ? offer.receiver : offer.initiator;
    const myItems = isInitiator ? offer.initiator_items : offer.receiver_items;
    const theirItems = isInitiator ? offer.receiver_items : offer.initiator_items;

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

    return (
        <TouchableOpacity 
            style={styles.container} 
            onPress={() => onPress(offer)}
            activeOpacity={0.7}
        >
            {/* Заголовок с пользователем и статусом */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        {otherUser.avatar_url ? (
                            <Image 
                                source={{ uri: otherUser.avatar_url }} 
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Icon name="person" size={16} color="#666" />
                            </View>
                        )}
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>
                            {otherUser.full_name || otherUser.username}
                        </Text>
                        <View style={styles.userMeta}>
                            <Text style={styles.userRole}>
                                {isInitiator ? 'Получатель' : 'Инициатор'}
                            </Text>
                            {otherUser.rating !== undefined && otherUser.rating !== null && (
                                <View style={styles.userRating}>
                                    <Icon name="star" size={12} color="#FFD700" />
                                    <Text style={styles.userRatingText}>
                                        {parseFloat(otherUser.rating.toString()).toFixed(1)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(offer.status.name) }]}>
                    <Icon 
                        name={getStatusIcon(offer.status.name)} 
                        size={12} 
                        color="white" 
                        style={styles.statusIcon}
                    />
                    <Text style={styles.statusText}>{offer.status.description}</Text>
                </View>
            </View>

            {/* Предметы обмена */}
            <View style={styles.itemsContainer}>
                {/* Мои предметы */}
                <View style={styles.itemsSection}>
                    <Text style={styles.sectionTitle}>
                        {isInitiator ? 'Предлагаю' : 'Запрашивают'}
                    </Text>
                    <View style={styles.itemsList}>
                        {myItems.slice(0, 3).map((item) => (
                            <View key={item.id} style={styles.itemPreview}>
                                {item.primary_image ? (
                                    <Image 
                                        source={{ uri: item.primary_image }} 
                                        style={styles.itemImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.itemImagePlaceholder}>
                                        <Icon name="image" size={16} color="#ccc" />
                                    </View>
                                )}
                            </View>
                        ))}
                        {myItems.length > 3 && (
                            <View style={styles.moreItems}>
                                <Text style={styles.moreItemsText}>+{myItems.length - 3}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Стрелка обмена */}
                <View style={styles.exchangeArrow}>
                    <Icon name="swap-horiz" size={24} color="#1976d2" />
                </View>

                {/* Их предметы */}
                <View style={styles.itemsSection}>
                    <Text style={styles.sectionTitle}>
                        {isInitiator ? 'За' : 'Предлагают'}
                    </Text>
                    <View style={styles.itemsList}>
                        {theirItems.slice(0, 3).map((item) => (
                            <View key={item.id} style={styles.itemPreview}>
                                {item.primary_image ? (
                                    <Image 
                                        source={{ uri: item.primary_image }} 
                                        style={styles.itemImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.itemImagePlaceholder}>
                                        <Icon name="image" size={16} color="#ccc" />
                                    </View>
                                )}
                            </View>
                        ))}
                        {theirItems.length > 3 && (
                            <View style={styles.moreItems}>
                                <Text style={styles.moreItemsText}>+{theirItems.length - 3}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Сообщение */}
            {offer.message && (
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText} numberOfLines={2}>
                        "{offer.message}"
                    </Text>
                </View>
            )}

            {/* Дата */}
            <View style={styles.footer}>
                <Text style={styles.dateText}>
                    {new Date(offer.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
                <Icon name="chevron-right" size={20} color="#666" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    userMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    userRole: {
        fontSize: 12,
        color: '#666',
        marginRight: 8,
    },
    userRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userRatingText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusIcon: {
        marginRight: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    itemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemsSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    itemsList: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemPreview: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginHorizontal: 2,
        overflow: 'hidden',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    itemImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreItems: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 2,
    },
    moreItemsText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#666',
    },
    exchangeArrow: {
        marginHorizontal: 16,
    },
    messageContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    messageText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
}); 