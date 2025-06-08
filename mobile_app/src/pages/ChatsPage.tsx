import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { chatService } from '../services/chatService';
import { Chat } from '../types/chat';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import TradeChatModal from '../components/chat/TradeChatModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UserChatModal from '../components/chat/UserChatModal';

const ChatsPage = () => {
    const navigation = useNavigation<any>();
    const { user } = useAppSelector((state) => state.auth);
    
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Состояние для модального окна чата
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [showChatModal, setShowChatModal] = useState(false);
    const [modalType, setModalType] = useState<'trade' | 'user'>('trade');

    // Загружаем чаты при входе на страницу
    useFocusEffect(
        useCallback(() => {
            loadChats();
        }, [])
    );

    const loadChats = async () => {
        try {
            setError(null);
            const response = await chatService.getChats();
            setChats(response.results);
        } catch (error: any) {
            console.error('ChatsPage: Ошибка загрузки чатов:', error);
            setError('Не удалось загрузить чаты');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadChats();
    };

    const handleChatPress = (chat: Chat) => {
        if (chat.trade_offer) {
            // Для чатов сделок открываем TradeChatModal
            setSelectedChat(chat);
            setModalType('trade');
            setShowChatModal(true);
        } else {
            // Для обычных чатов между пользователями открываем UserChatModal
            setSelectedChat(chat);
            setModalType('user');
            setShowChatModal(true);
        }
    };

    const getOtherUser = (chat: Chat) => {
        if (!user) return null;
        return chat.participants_details.find(participant => participant.id !== user.id);
    };

    const formatLastMessageTime = (timeString: string | null) => {
        if (!timeString) return '';
        
        const date = new Date(timeString);
        const now = new Date();
        const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            // Сегодня - показываем время
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (diffInHours < 24 * 7) {
            // На этой неделе - показываем день недели
            return date.toLocaleDateString('ru-RU', { weekday: 'short' });
        } else {
            // Давно - показываем дату
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short'
            });
        }
    };

    const renderChatItem = ({ item }: { item: Chat }) => {
        const otherUser = getOtherUser(item);
        const hasUnread = item.unread_count > 0;
        
        return (
            <TouchableOpacity
                style={[styles.chatItem, hasUnread && styles.chatItemUnread]}
                onPress={() => handleChatPress(item)}
            >
                <View style={styles.avatarContainer}>
                    {otherUser?.avatar_url ? (
                        <Image 
                            source={{ uri: otherUser.avatar_url }} 
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Icon name="person" size={24} color="#666" />
                        </View>
                    )}
                    {hasUnread && <View style={styles.unreadIndicator} />}
                </View>
                
                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.chatTitle, hasUnread && styles.chatTitleUnread]}>
                            {item.trade_offer ? 
                                `Сделка #${item.trade_offer}` : 
                                (otherUser?.full_name || otherUser?.username || 'Неизвестный пользователь')
                            }
                        </Text>
                        <Text style={styles.chatTime}>
                            {formatLastMessageTime(item.last_message_time)}
                        </Text>
                    </View>
                    
                    <View style={styles.chatFooter}>
                        <Text 
                            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
                            numberOfLines={1}
                        >
                            {item.last_message ? 
                                `${item.last_message.sender_details.username}: ${item.last_message.content}` :
                                'Сообщений пока нет'
                            }
                        </Text>
                        {hasUnread && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadCount}>
                                    {item.unread_count > 99 ? '99+' : item.unread_count}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    <Text style={styles.chatSubtitle}>
                        с {otherUser?.full_name || otherUser?.username || 'Неизвестный пользователь'}
                    </Text>
                </View>
                
                <Icon name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
        );
    };

    if (loading) {
        return <Loading fullscreen text="Загрузка чатов..." />;
    }

    if (error) {
        return (
            <Error 
                message={error} 
                onRetry={loadChats} 
                fullscreen 
            />
        );
    }

    return (
        <View style={styles.container}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                >
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Чаты</Text>
                <TouchableOpacity 
                    onPress={handleRefresh} 
                    style={styles.refreshButton}
                    disabled={refreshing}
                >
                    <Icon 
                        name="refresh" 
                        size={24} 
                        color={refreshing ? "#ccc" : "#1976d2"} 
                    />
                </TouchableOpacity>
            </View>

            {/* Список чатов */}
            {chats.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="chat" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>Нет чатов</Text>
                    <Text style={styles.emptySubtitle}>
                        Чаты появятся после начала переговоров по сделкам
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderChatItem}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#1976d2']}
                        />
                    }
                    contentContainerStyle={styles.listContainer}
                />
            )}

            {/* Модальное окно чата */}
            {selectedChat && user && (
                <>
                    {modalType === 'trade' && selectedChat.trade_offer ? (
                        <TradeChatModal
                            visible={showChatModal}
                            onClose={() => {
                                setShowChatModal(false);
                                setSelectedChat(null);
                                // Обновляем список чатов после закрытия
                                loadChats();
                            }}
                            tradeOfferId={selectedChat.trade_offer}
                            initiator={selectedChat.participants_details[0]}
                            receiver={selectedChat.participants_details[1]}
                            currentUser={user}
                        />
                    ) : modalType === 'user' ? (
                        <UserChatModal
                            visible={showChatModal}
                            onClose={() => {
                                setShowChatModal(false);
                                setSelectedChat(null);
                                // Обновляем список чатов после закрытия
                                loadChats();
                            }}
                            otherUser={getOtherUser(selectedChat)!}
                            currentUser={user}
                        />
                    ) : null}
                </>
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
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        flexGrow: 1,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    chatItemUnread: {
        backgroundColor: '#f8f9ff',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1976d2',
        position: 'absolute',
        top: 0,
        right: 0,
        borderWidth: 2,
        borderColor: 'white',
    },
    chatInfo: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    chatTitleUnread: {
        fontWeight: 'bold',
    },
    chatTime: {
        fontSize: 12,
        color: '#999',
        marginLeft: 8,
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    lastMessageUnread: {
        color: '#333',
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: '#1976d2',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    unreadCount: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    chatSubtitle: {
        fontSize: 12,
        color: '#999',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ChatsPage; 