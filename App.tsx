import React from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Toast from 'react-native-toast-message';
import 'react-native-url-polyfill/auto';

// Import screens
import AuthScreen from './src/pages/Auth';
import DashboardScreen from './src/pages/Dashboard';
import WardrobeScreen from './src/pages/Wardrobe';
import ProfileScreen from './src/pages/EditProfile';
import IndexScreen from './src/pages/Index';

// Import providers and context
import { OnboardingProvider } from './src/components/onboarding/OnboardingProvider';
import { ThemeProvider } from './src/hooks/useTheme';
import { AuthProvider } from './src/hooks/useAuth';
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Wardrobe" 
        component={WardrobeScreen}
        options={{
          tabBarLabel: 'Wardrobe',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👗</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Index"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Index" component={IndexScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="default">
          <AuthProvider>
            <OnboardingProvider>
              <NavigationContainer>
                <AppNavigator />
                <StatusBar style="auto" />
                <Toast />
              </NavigationContainer>
            </OnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
