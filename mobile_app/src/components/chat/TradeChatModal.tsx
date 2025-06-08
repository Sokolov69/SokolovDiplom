import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { chatService } from '../../services/chatService';
import { Chat, Message, CreateChatData } from '../../types/chat';
import { User } from '../../types/auth';
import { Loading } from '../common/Loading';

interface TradeChatModalProps {
    visible: boolean;
    onClose: () => void;
    tradeOfferId: number;
    initiator: User;
    receiver: User;
    currentUser: User;
}

const TradeChatModal: React.FC<TradeChatModalProps> = ({
    visible,
    onClose,
    tradeOfferId,
    initiator,
    receiver,
    currentUser
}) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    
    const flatListRef = useRef<FlatList>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (visible) {
            loadChat();
        } else {
            // Сброс состояния при закрытии
            setChat(null);
            setMessages([]);
            setMessageText('');
            lastMessageIdRef.current = null;
            
            // Очищаем интервал опроса
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        }
    }, [visible, tradeOfferId]);

    useEffect(() => {
        if (chat) {
            loadMessages();
            startPolling();
        }
        
        return () => {
            // Очищаем интервал при размонтировании или изменении чата
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [chat]);

    // Обновляем lastMessageId когда загружаются сообщения
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            lastMessageIdRef.current = lastMessage.id;
        }
    }, [messages]);

    const startPolling = () => {
        // Очищаем предыдущий интервал если есть
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
        
        // Запускаем новый интервал опроса каждые 5 секунд
        pollingIntervalRef.current = setInterval(() => {
            checkForNewMessages();
        }, 5000);
    };

    const checkForNewMessages = async () => {
        if (!chat || messagesLoading || sending) return;
        
        try {
            const response = await chatService.getMessages(chat.id);
            const newMessages = response.results.reverse();
            
            // Если есть новые сообщения
            if (newMessages.length > 0) {
                const lastMessageId = lastMessageIdRef.current;
                
                if (lastMessageId) {
                    // Фильтруем только новые сообщения
                    const filteredNewMessages = newMessages.filter(msg => msg.id > lastMessageId);
                    
                    if (filteredNewMessages.length > 0) {
                        console.log('TradeChatModal: Найдены новые сообщения:', filteredNewMessages.length);
                        setMessages(prev => [...prev, ...filteredNewMessages]);
                        
                        // Отмечаем чат как прочитанный
                        await chatService.markChatAsRead(chat.id);
                        
                        // Скроллим к низу
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                    }
                } else {
                    // Если lastMessageId нет, загружаем все сообщения
                    setMessages(newMessages);
                }
            }
        } catch (error: any) {
            console.error('TradeChatModal: Ошибка проверки новых сообщений:', error);
            // Не показываем алерт для ошибок polling, чтобы не мешать пользователю
        }
    };

    const refreshMessages = async () => {
        if (!chat || messagesLoading) return;
        
        console.log('TradeChatModal: Ручное обновление сообщений');
        await loadMessages();
    };

    const loadChat = async () => {
        setLoading(true);
        console.log('TradeChatModal: Загрузка чата для сделки', tradeOfferId);
        console.log('TradeChatModal: Текущий пользователь:', currentUser);
        console.log('TradeChatModal: Инициатор:', initiator);
        console.log('TradeChatModal: Получатель:', receiver);
        
        try {
            // Пытаемся получить существующий чат
            const existingChat = await chatService.getChatByTrade(tradeOfferId);
            console.log('TradeChatModal: Найден существующий чат:', existingChat);
            setChat(existingChat);
        } catch (error: any) {
            console.log('TradeChatModal: Ошибка при поиске чата:', error);
            if (error.response?.status === 404) {
                console.log('TradeChatModal: Чат не найден, создаем новый');
                // Чат не найден, создаем новый
                await createChat();
            } else {
                console.error('TradeChatModal: Неожиданная ошибка загрузки чата:', error);
                Alert.alert('Ошибка', 'Не удалось загрузить чат');
            }
        } finally {
            setLoading(false);
        }
    };

    const createChat = async () => {
        console.log('TradeChatModal: Создание нового чата');
        try {
            const chatData: CreateChatData = {
                participants: [initiator.id, receiver.id],
                trade_offer: tradeOfferId
            };
            
            console.log('TradeChatModal: Данные для создания чата:', chatData);
            const newChat = await chatService.createChat(chatData);
            console.log('TradeChatModal: Чат успешно создан:', newChat);
            setChat(newChat);
        } catch (error: any) {
            console.error('TradeChatModal: Ошибка создания чата:', error);
            console.error('TradeChatModal: Подробности ошибки:', error.response?.data);
            Alert.alert('Ошибка', 'Не удалось создать чат');
        }
    };

    const loadMessages = async () => {
        if (!chat) return;
        
        setMessagesLoading(true);
        try {
            const response = await chatService.getMessages(chat.id);
            // Сообщения приходят в обратном порядке (новые первые)
            setMessages(response.results.reverse());
            
            // Отмечаем чат как прочитанный
            await chatService.markChatAsRead(chat.id);
        } catch (error: any) {
            console.error('Ошибка загрузки сообщений:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить сообщения');
        } finally {
            setMessagesLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!chat || !messageText.trim()) return;

        setSending(true);
        try {
            const newMessage = await chatService.sendMessage({
                chat: chat.id,
                content: messageText.trim()
            });

            setMessages(prev => [...prev, newMessage]);
            setMessageText('');
            
            // Обновляем lastMessageId сразу после отправки
            lastMessageIdRef.current = newMessage.id;
            
            // Скроллим к низу
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error: any) {
            console.error('Ошибка отправки сообщения:', error);
            Alert.alert('Ошибка', 'Не удалось отправить сообщение');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            // Сегодня - показываем только время
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            // Другой день - показываем дату и время
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender === currentUser.id;
        const sender = isMyMessage ? currentUser : (item.sender === initiator.id ? initiator : receiver);

        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}>
                {!isMyMessage && (
                    <View style={styles.senderInfo}>
                        <View style={styles.senderAvatar}>
                            {sender.avatar_url ? (
                                <Image 
                                    source={{ uri: sender.avatar_url }} 
                                    style={styles.avatarImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Icon name="person" size={16} color="#666" />
                            )}
                        </View>
                        <Text style={styles.senderName}>
                            {sender.full_name || sender.username}
                        </Text>
                    </View>
                )}
                
                <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
                    <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
                        {formatTime(item.created_at)}
                    </Text>
                </View>
            </View>
        );
    };

    const otherUser = currentUser.id === initiator.id ? receiver : initiator;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Заголовок */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>
                            Чат по сделке #{tradeOfferId}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            с {otherUser.full_name || otherUser.username}
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        onPress={refreshMessages} 
                        style={styles.refreshButton}
                        disabled={messagesLoading}
                    >
                        <Icon 
                            name="refresh" 
                            size={24} 
                            color={messagesLoading ? "#ccc" : "#1976d2"} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Контент */}
                {loading ? (
                    <Loading text="Загрузка чата..." />
                ) : (
                    <View style={styles.content}>
                        {/* Сообщения */}
                        <View style={styles.messagesContainer}>
                            {messagesLoading ? (
                                <Loading text="Загрузка сообщений..." />
                            ) : messages.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Icon name="chat" size={48} color="#ccc" />
                                    <Text style={styles.emptyText}>
                                        Пока нет сообщений
                                    </Text>
                                    <Text style={styles.emptySubtext}>
                                        Начните общение с собеседником
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    ref={flatListRef}
                                    data={messages}
                                    renderItem={renderMessage}
                                    keyExtractor={(item) => item.id.toString()}
                                    contentContainerStyle={styles.messagesList}
                                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                />
                            )}
                        </View>

                        {/* Поле ввода */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                value={messageText}
                                onChangeText={setMessageText}
                                placeholder="Введите сообщение..."
                                multiline
                                maxLength={1000}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
                                onPress={sendMessage}
                                disabled={!messageText.trim() || sending}
                            >
                                <Icon 
                                    name={sending ? "hourglass-empty" : "send"} 
                                    size={24} 
                                    color={(!messageText.trim() || sending) ? "#ccc" : "#1976d2"} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>
        </Modal>
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
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesList: {
        padding: 16,
        flexGrow: 1,
    },
    messageContainer: {
        marginBottom: 16,
    },
    myMessage: {
        alignItems: 'flex-end',
    },
    otherMessage: {
        alignItems: 'flex-start',
    },
    senderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    senderAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    senderName: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    myMessageBubble: {
        backgroundColor: '#1976d2',
    },
    otherMessageBubble: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 18,
    },
    myMessageText: {
        color: 'white',
    },
    otherMessageText: {
        color: '#333',
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
    },
    myMessageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'right',
    },
    otherMessageTime: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        maxHeight: 100,
        marginRight: 12,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    refreshButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
});

export default TradeChatModal; 