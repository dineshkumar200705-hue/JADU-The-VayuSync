import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { StreamScreen } from './src/screens/StreamScreen';
import { GestureControlScreen } from './src/screens/GestureControlScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🏠', Stream: '📡', Control: '👆' };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[label]}</Text>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#00e5ff',
            tabBarInactiveTintColor: '#6b7280',
            headerStyle: styles.header,
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'AirMouse AI' }} />
          <Tab.Screen name="Stream" component={StreamScreen} options={{ title: 'Mobile → Laptop' }} />
          <Tab.Screen name="Control" component={GestureControlScreen} options={{ title: 'Mobile Nav' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#111827', borderTopColor: '#1f2937' },
  header: { backgroundColor: '#0f172a' },
});
