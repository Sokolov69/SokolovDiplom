import React, { useEffect, useRef } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { store } from './src/store';
import { HomePage } from './src/pages/HomePage';
import { LoginForm } from './src/components/auth/LoginForm';
import { RegisterForm } from './src/components/auth/RegisterForm';
import { ProfilePage } from './src/pages/ProfilePage';
import { UserProfilePage } from './src/pages/UserProfilePage';
import { CategoriesPage } from './src/pages/CategoriesPage';
import { CategoryDetailPage } from './src/pages/CategoryDetailPage';
import CreateItemPage from './src/pages/CreateItemPage';
import ItemDetailPage from './src/pages/ItemDetailPage';
import EditItemPage from './src/pages/EditItemPage';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { checkAuth } from './src/features/auth/authThunks';
import { View, ActivityIndicator } from 'react-native';
import { Layout } from './src/components/layout/Layout';
import { AdminPage } from './src/pages/AdminPage';
import { FavoritesPage } from './src/pages/FavoritesPage';
import TradesPage from './src/pages/TradesPage';
import TradeDetailPage from './src/pages/TradeDetailPage';
import CreateTradePage from './src/pages/CreateTradePage';
import ChatsPage from './src/pages/ChatsPage';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

const Stack = createNativeStackNavigator();

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();

    console.log('[PrivateRoute] Render - loading:', loading, 'user:', user ? `${user.username} (ID: ${user.id})` : 'null');

    useEffect(() => {
        console.log('[PrivateRoute] useEffect - dispatching checkAuth');
        dispatch(checkAuth());
    }, [dispatch]);

    if (loading) {
        console.log('[PrivateRoute] Showing loading screen');
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (user) {
        console.log('[PrivateRoute] User authenticated, rendering children');
        return <>{children}</>;
    } else {
        console.log('[PrivateRoute] No user, showing LoginForm');
        return <LoginForm />;
    }
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();

    console.log('[PublicRoute] Render - loading:', loading, 'user:', user ? `${user.username} (ID: ${user.id})` : 'null');

    useEffect(() => {
        console.log('[PublicRoute] useEffect - dispatching checkAuth');
        dispatch(checkAuth());
    }, [dispatch]);

    if (loading) {
        console.log('[PublicRoute] Showing loading screen');
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!user) {
        console.log('[PublicRoute] No user, rendering children');
        return <>{children}</>;
    } else {
        console.log('[PublicRoute] User authenticated, returning null');
        return null;
    }
};

// Создаем отдельные компоненты для каждого экрана
const HomeScreen = () => {
    console.log('[HomeScreen] Rendering');
    return (
        <PrivateRoute>
            <Layout>
                <HomePage />
            </Layout>
        </PrivateRoute>
    );
};

const LoginScreen = () => {
    console.log('[LoginScreen] Rendering');
    return (
        <PublicRoute>
            <LoginForm />
        </PublicRoute>
    );
};

const RegisterScreen = () => {
    console.log('[RegisterScreen] Rendering');
    return (
        <PublicRoute>
            <RegisterForm />
        </PublicRoute>
    );
};

const ProfileScreen = () => {
    console.log('[ProfileScreen] Rendering');
    return (
        <PrivateRoute>
            <Layout>
                <ProfilePage />
            </Layout>
        </PrivateRoute>
    );
};

const UserProfileScreen = () => (
    <PrivateRoute>
        <Layout>
            <UserProfilePage />
        </Layout>
    </PrivateRoute>
);

const CategoriesScreen = () => (
    <PrivateRoute>
        <Layout>
            <CategoriesPage />
        </Layout>
    </PrivateRoute>
);

const CategoryDetailScreen = () => (
    <PrivateRoute>
        <Layout>
            <CategoryDetailPage />
        </Layout>
    </PrivateRoute>
);

const FavoritesScreen = () => (
    <PrivateRoute>
        <Layout>
            <FavoritesPage />
        </Layout>
    </PrivateRoute>
);

const CreateItemScreen = () => (
    <PrivateRoute>
        <Layout>
            <CreateItemPage />
        </Layout>
    </PrivateRoute>
);

const ItemDetailScreen = () => (
    <PrivateRoute>
        <Layout>
            <ItemDetailPage />
        </Layout>
    </PrivateRoute>
);

const EditItemScreen = () => (
    <PrivateRoute>
        <Layout>
            <EditItemPage />
        </Layout>
    </PrivateRoute>
);

const AdminScreen = () => (
    <PrivateRoute>
        <Layout>
            <AdminPage />
        </Layout>
    </PrivateRoute>
);

const TradesScreen = () => (
    <PrivateRoute>
        <Layout>
            <TradesPage />
        </Layout>
    </PrivateRoute>
);

const TradeDetailScreen = () => (
    <PrivateRoute>
        <Layout>
            <TradeDetailPage />
        </Layout>
    </PrivateRoute>
);

const CreateTradeScreen = () => (
    <PrivateRoute>
        <Layout>
            <CreateTradePage />
        </Layout>
    </PrivateRoute>
);

const ChatsScreen = () => (
    <PrivateRoute>
        <Layout>
            <ChatsPage />
        </Layout>
    </PrivateRoute>
);

const AppContent: React.FC = () => {
    console.log('[AppContent] Rendering Stack Navigator');
    
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="Home"
                component={HomeScreen}
            />
            <Stack.Screen
                name="Login"
                component={LoginScreen}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
            />
            <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
            />
            <Stack.Screen
                name="Categories"
                component={CategoriesScreen}
            />
            <Stack.Screen
                name="CategoryDetail"
                component={CategoryDetailScreen}
            />
            <Stack.Screen
                name="Favorites"
                component={FavoritesScreen}
            />
            <Stack.Screen
                name="CreateItem"
                component={CreateItemScreen}
            />
            <Stack.Screen
                name="ItemDetail"
                component={ItemDetailScreen}
            />
            <Stack.Screen
                name="EditItem"
                component={EditItemScreen}
            />
            <Stack.Screen
                name="Admin"
                component={AdminScreen}
            />
            <Stack.Screen
                name="Trades"
                component={TradesScreen}
            />
            <Stack.Screen
                name="TradeDetail"
                component={TradeDetailScreen}
            />
            <Stack.Screen
                name="CreateTrade"
                component={CreateTradeScreen}
            />
            <Stack.Screen
                name="Chats"
                component={ChatsScreen}
            />
        </Stack.Navigator>
    );
};

const NavigationHandler: React.FC = () => {
    const navigation = useNavigation();
    const { user, loading } = useAppSelector((state) => state.auth);
    const prevUserRef = useRef(user);
    
    useEffect(() => {
        // Если пользователь только что вошел (был null, стал не null)
        if (!prevUserRef.current && user && !loading) {
            console.log('[NavigationHandler] User just logged in, navigating to Home');
            navigation.navigate('Home' as never);
        }
        prevUserRef.current = user;
    }, [user, loading, navigation]);
    
    return null;
};

export default function App() {
    console.log('[App] Rendering main App component');
    
    return (
        <Provider store={store}>
            <ErrorBoundary>
                <PaperProvider>
                    <NavigationContainer>
                        <NavigationHandler />
                        <AppContent />
                    </NavigationContainer>
                </PaperProvider>
            </ErrorBoundary>
        </Provider>
    );
}
