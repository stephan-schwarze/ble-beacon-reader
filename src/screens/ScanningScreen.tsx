import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { NavigationProps, BeaconRead, Session } from '../types';
import { BleService } from '../services/BleService';
import { StorageService } from '../services/StorageService';

const BleServiceInstance = BleService.getInstance();

const ScanningScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [beaconReads, setBeaconReads] = useState<BeaconRead[]>([]);
  const [bluetoothState, setBluetoothState] = useState<string>('unknown');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
    return () => {
      // Cleanup on unmount
      if (isScanning) {
        BleServiceInstance.stopScanning();
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize BLE service
      await BleServiceInstance.initialize();
      
      // Request permissions
      const hasPermissions = await BleServiceInstance.requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permissions Required',
          'Bluetooth and location permissions are required for beacon scanning.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check Bluetooth state
      const state = await BleServiceInstance.getBluetoothState();
      setBluetoothState(state);

      if (state !== 'on') {
        Alert.alert(
          'Bluetooth Required',
          'Please enable Bluetooth to scan for beacons.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Set up beacon found callback
      BleServiceInstance.setBeaconFoundCallback((beaconRead: BeaconRead) => {
        setBeaconReads(prev => [beaconRead, ...prev]);
      });

      // Load current session if exists
      const session = await StorageService.getCurrentSession();
      if (session) {
        setCurrentSession(session);
        setBeaconReads(session.beaconReads);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize the app');
    }
  };

  const startScanning = async () => {
    try {
      if (bluetoothState !== 'on') {
        Alert.alert('Bluetooth Required', 'Please enable Bluetooth first');
        return;
      }

      // Create new session if none exists
      if (!currentSession) {
        const newSession: Session = {
          id: `session_${Date.now()}`,
          name: `Session ${new Date().toLocaleString()}`,
          startTime: Date.now(),
          beaconReads: [],
        };
        setCurrentSession(newSession);
        await StorageService.saveCurrentSession(newSession);
      }

      await BleServiceInstance.startScanning();
      setIsScanning(true);
    } catch (error) {
      console.error('Error starting scan:', error);
      Alert.alert('Error', 'Failed to start scanning');
    }
  };

  const stopScanning = async () => {
    try {
      await BleServiceInstance.stopScanning();
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scan:', error);
      Alert.alert('Error', 'Failed to stop scanning');
    }
  };

  const saveSession = async () => {
    if (!sessionName.trim()) {
      Alert.alert('Error', 'Please enter a session name');
      return;
    }

    if (!currentSession) {
      Alert.alert('Error', 'No active session to save');
      return;
    }

    try {
      const sessionToSave: Session = {
        ...currentSession,
        name: sessionName.trim(),
        endTime: Date.now(),
      };

      await StorageService.saveSession(sessionToSave);
      await StorageService.saveCurrentSession(null);
      
      setCurrentSession(null);
      setBeaconReads([]);
      setShowSaveModal(false);
      setSessionName('');
      
      Alert.alert('Success', 'Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session');
    }
  };

  const clearCurrentSession = () => {
    Alert.alert(
      'Clear Session',
      'Are you sure you want to clear the current session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.saveCurrentSession(null);
              setCurrentSession(null);
              setBeaconReads([]);
            } catch (error) {
              console.error('Error clearing session:', error);
              Alert.alert('Error', 'Failed to clear session');
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderBeaconRead = ({ item }: { item: BeaconRead }) => (
    <View style={styles.beaconItem}>
      <View style={styles.beaconHeader}>
        <Text style={styles.beaconUuid}>{item.uuid}</Text>
        <Text style={styles.beaconTime}>{formatTimestamp(item.timestamp)}</Text>
      </View>
      <View style={styles.beaconDetails}>
        <Text style={styles.beaconDetail}>Major: {item.major}</Text>
        <Text style={styles.beaconDetail}>Minor: {item.minor}</Text>
        <Text style={styles.beaconDetail}>RSSI: {item.rssi} dBm</Text>
      </View>
    </View>
  );

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BLE Beacon Scanner</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Sessions')}
          >
            <Text style={styles.headerButtonText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Bluetooth: {bluetoothState === 'on' ? '✅ On' : '❌ Off'}
        </Text>
        <Text style={styles.statusText}>
          Status: {isScanning ? '🔍 Scanning' : '⏸️ Stopped'}
        </Text>
        <Text style={styles.statusText}>
          Reads: {beaconReads.length}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, isScanning ? styles.stopButton : styles.startButton]}
          onPress={isScanning ? stopScanning : startScanning}
        >
          <Text style={styles.buttonText}>
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </Text>
        </TouchableOpacity>

        {currentSession && (
          <View style={styles.sessionControls}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => setShowSaveModal(true)}
            >
              <Text style={styles.saveButtonText}>Save Session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearCurrentSession}
            >
              <Text style={styles.clearButtonText}>Clear Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Beacon Reads</Text>
        <FlatList
          data={beaconReads}
          renderItem={renderBeaconRead}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Session</Text>
            <TextInput
              style={styles.modalInput}
              value={sessionName}
              onChangeText={setSessionName}
              placeholder="Enter session name"
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveSession}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerButtonText: {
    fontSize: 20,
  },
  statusContainer: {
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
  statusText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  controlsContainer: {
    padding: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sessionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  list: {
    flex: 1,
  },
  beaconItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  beaconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  beaconUuid: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  beaconTime: {
    fontSize: 12,
    color: '#666',
  },
  beaconDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  beaconDetail: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    backgroundColor: '#8E8E93',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ScanningScreen;
