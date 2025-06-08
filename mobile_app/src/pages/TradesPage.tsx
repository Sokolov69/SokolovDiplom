import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity,
    RefreshControl 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTradeOffers } from '../features/trades/tradesThunks';
import { TradeOfferCard } from '../components/trades/TradeOfferCard';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import Icon from 'react-native-vector-icons/MaterialIcons';

type TabType = 'all' | 'sent' | 'received';

const TradesPage = () => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const { offers, loading, error } = useAppSelector((state) => state.trades);
    const { user } = useAppSelector((state) => state.auth);
    
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadOffers();
    }, [activeTab]);

    const loadOffers = async () => {
        const filter = activeTab === 'all' ? {} : { type: activeTab };
        await dispatch(fetchTradeOffers(filter));
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadOffers();
        setRefreshing(false);
    };

    const handleOfferPress = (offer: any) => {
        navigation.navigate('TradeDetail', { offerId: offer.id });
    };

    const getTabCount = (tab: TabType) => {
        if (tab === 'all') return offers.length;
        if (tab === 'sent') {
            return offers.filter(offer => offer.initiator.id === user?.id).length;
        }
        if (tab === 'received') {
            return offers.filter(offer => offer.receiver.id === user?.id).length;
        }
        return 0;
    };

    const getFilteredOffers = () => {
        if (activeTab === 'all') return offers;
        if (activeTab === 'sent') {
            return offers.filter(offer => offer.initiator.id === user?.id);
        }
        if (activeTab === 'received') {
            return offers.filter(offer => offer.receiver.id === user?.id);
        }
        return [];
    };

    const renderTab = (tab: TabType, label: string, icon: string) => {
        const isActive = activeTab === tab;
        const count = getTabCount(tab);
        
        return (
            <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
            >
                <Icon 
                    name={icon} 
                    size={20} 
                    color={isActive ? '#1976d2' : '#666'} 
                />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                    {label}
                </Text>
                {count > 0 && (
                    <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{count}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading && offers.length === 0) {
        return <Loading fullscreen text="Загрузка обменов..." />;
    }

    if (error) {
        return (
            <Error 
                message={error} 
                onRetry={loadOffers} 
                fullscreen 
            />
        );
    }

    const filteredOffers = getFilteredOffers();

    return (
        <View style={styles.container}>
            {/* Заголовок */}
            <View style={styles.header}>
                <Text style={styles.title}>Обмены</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={styles.chatsButton}
                        onPress={() => navigation.navigate('Chats')}
                    >
                        <Icon name="chat" size={24} color="#1976d2" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreateTrade')}
                    >
                        <Icon name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Вкладки */}
            <View style={styles.tabsContainer}>
                {renderTab('all', 'Все', 'list')}
                {renderTab('sent', 'Отправленные', 'send')}
                {renderTab('received', 'Полученные', 'inbox')}
            </View>

            {/* Список обменов */}
            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#1976d2']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {filteredOffers.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="swap-horiz" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'all' && 'Нет обменов'}
                            {activeTab === 'sent' && 'Нет отправленных предложений'}
                            {activeTab === 'received' && 'Нет полученных предложений'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'all' && 'Создайте первое предложение обмена'}
                            {activeTab === 'sent' && 'Предложите обмен другим пользователям'}
                            {activeTab === 'received' && 'Пока никто не предложил вам обмен'}
                        </Text>
                        {activeTab !== 'received' && (
                            <TouchableOpacity 
                                style={styles.emptyButton}
                                onPress={() => navigation.navigate('CreateTrade')}
                            >
                                <Text style={styles.emptyButtonText}>Создать предложение</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.offersList}>
                        {filteredOffers.map((offer) => (
                            <TradeOfferCard
                                key={offer.id}
                                offer={offer}
                                currentUserId={user?.id || 0}
                                onPress={handleOfferPress}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    createButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1976d2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#1976d2',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginLeft: 8,
    },
    activeTabText: {
        color: '#1976d2',
        fontWeight: '600',
    },
    tabBadge: {
        backgroundColor: '#1976d2',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 64,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    emptyButton: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginTop: 24,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    offersList: {
        paddingBottom: 16,
    },
});

export default TradesPage; 