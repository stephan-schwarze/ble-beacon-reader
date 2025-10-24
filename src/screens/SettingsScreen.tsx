import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { isValidUUID, formatUUID } from '../utils/uuidUtils';

const SettingsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [settings, setSettings] = useState<Settings>({
    targetUuid: 'E101B392ADA32224231605EF58774925',
    rssiThreshold: -70,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await StorageService.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      // Validate UUID format
      if (!isValidUUID(settings.targetUuid)) {
        Alert.alert('Invalid UUID', 'Please enter a valid UUID format (e.g., E101B392-ADA3-2224-2316-05EF58774925)');
        return;
      }

      // Validate RSSI threshold
      if (settings.rssiThreshold < -100 || settings.rssiThreshold > 0) {
        Alert.alert('Invalid RSSI', 'RSSI threshold must be between -100 and 0 dBm');
        return;
      }

      await StorageService.saveSettings(settings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              targetUuid: 'E101B392ADA32224231605EF58774925',
              rssiThreshold: -70,
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>iBeacon Configuration</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target UUID</Text>
            <TextInput
              style={styles.input}
              value={settings.targetUuid}
              onChangeText={(text) => setSettings({ ...settings, targetUuid: formatUUID(text) })}
              placeholder="E101B392-ADA3-2224-2316-05EF58774925"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.helpText}>
              Only beacons with this UUID will be stored
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>RSSI Threshold (dBm)</Text>
            <TextInput
              style={styles.input}
              value={settings.rssiThreshold.toString()}
              onChangeText={(text) => {
                const value = parseInt(text, 10);
                if (!isNaN(value)) {
                  setSettings({ ...settings, rssiThreshold: value });
                }
              }}
              placeholder="-70"
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>
              Only beacons with RSSI stronger than this value will be stored
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SettingsScreen;
