import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AdminCategoryList } from './categories/AdminCategoryList';

type TabType = 'categories' | 'users' | 'settings';

const AdminTabMenu: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('categories');
    
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
    };
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'categories':
                return <AdminCategoryList />;
            case 'users':
                return (
                    <View style={styles.centeredContent}>
                        <Text style={styles.comingSoonText}>
                            Управление пользователями (в разработке)
                        </Text>
                    </View>
                );
            case 'settings':
                return (
                    <View style={styles.centeredContent}>
                        <Text style={styles.comingSoonText}>
                            Настройки (в разработке)
                        </Text>
                    </View>
                );
            default:
                return null;
        }
    };
    
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScrollView}
                contentContainerStyle={styles.tabsContainer}
            >
                <TouchableOpacity
                    style={[
                        styles.tabItem,
                        activeTab === 'categories' && styles.activeTabItem
                    ]}
                    onPress={() => handleTabChange('categories')}
                >
                    <Icon 
                        name="category" 
                        size={22} 
                        color={activeTab === 'categories' ? '#1976d2' : '#666'} 
                    />
                    <Text 
                        style={[
                            styles.tabText,
                            activeTab === 'categories' && styles.activeTabText
                        ]}
                    >
                        Категории
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[
                        styles.tabItem,
                        activeTab === 'users' && styles.activeTabItem
                    ]}
                    onPress={() => handleTabChange('users')}
                >
                    <Icon 
                        name="people" 
                        size={22} 
                        color={activeTab === 'users' ? '#1976d2' : '#666'} 
                    />
                    <Text 
                        style={[
                            styles.tabText,
                            activeTab === 'users' && styles.activeTabText
                        ]}
                    >
                        Пользователи
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[
                        styles.tabItem,
                        activeTab === 'settings' && styles.activeTabItem
                    ]}
                    onPress={() => handleTabChange('settings')}
                >
                    <Icon 
                        name="settings" 
                        size={22} 
                        color={activeTab === 'settings' ? '#1976d2' : '#666'} 
                    />
                    <Text 
                        style={[
                            styles.tabText,
                            activeTab === 'settings' && styles.activeTabText
                        ]}
                    >
                        Настройки
                    </Text>
                </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.contentContainer}>
                {renderTabContent()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabsScrollView: {
        maxHeight: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabsContainer: {
        paddingHorizontal: 16,
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginRight: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabItem: {
        borderBottomColor: '#1976d2',
    },
    tabText: {
        fontSize: 16,
        marginLeft: 8,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#1976d2',
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        paddingVertical: 16,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    comingSoonText: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
    },
});

export default AdminTabMenu; 