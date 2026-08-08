/**
 * SHEAZ — Navigation
 * Stack racine (Tabs + écrans plein écran) + bottom tabs (4 onglets).
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, typography } from '../theme';
import DashboardScreen from '../screens/DashboardScreen';
import SportScreen from '../screens/SportScreen';
import BienEtreScreen from '../screens/BienEtreScreen';
import MentalScreen from '../screens/MentalScreen';
import RecompensesScreen from '../screens/RecompensesScreen';
import PremiumScreen from '../screens/PremiumScreen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Icônes MaterialCommunityIcons — variante outline pour l'état inactif quand elle existe */
const TAB_ICONS: Record<keyof TabParamList, { active: IconName; inactive?: IconName }> = {
  Jour: { active: 'home-variant', inactive: 'home-variant-outline' },
  Sport: { active: 'dumbbell' },
  BienEtre: { active: 'water', inactive: 'water-outline' },
  MentalTab: { active: 'meditation' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.sport,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { ...typography.caption, fontSize: 10 },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 84,
          paddingBottom: 22,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color }) => {
          const icon = TAB_ICONS[route.name];
          const name = focused ? icon.active : (icon.inactive ?? icon.active);
          return <MaterialCommunityIcons name={name} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Jour" component={DashboardScreen} />
      <Tab.Screen name="Sport" component={SportScreen} />
      <Tab.Screen name="BienEtre" component={BienEtreScreen} options={{ title: 'Bien-être' }} />
      <Tab.Screen name="MentalTab" component={MentalScreen} options={{ title: 'Mental' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={MainTabs} />
        <Stack.Screen name="Recompenses" component={RecompensesScreen} />
        <Stack.Screen name="Premium" component={PremiumScreen} />
        <Stack.Screen name="Mental" component={MentalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
