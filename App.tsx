import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import ScanningScreen from './src/screens/ScanningScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SessionsScreen from './src/screens/SessionsScreen';

const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Scanning"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Scanning" component={ScanningScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Sessions" component={SessionsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
