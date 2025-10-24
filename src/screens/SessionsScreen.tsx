import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  FlatList,
  Modal,
} from 'react-native';
import { NavigationProps, Session, BeaconRead } from '../types';
import { StorageService } from '../services/StorageService';

const SessionsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const savedSessions = await StorageService.getSessions();
      setSessions(savedSessions.sort((a, b) => b.startTime - a.startTime));
    } catch (error) {
      console.error('Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteSession(sessionId);
              await loadSessions();
              Alert.alert('Success', 'Session deleted successfully');
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  const viewSessionDetails = (session: Session) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const renderSession = ({ item }: { item: Session }) => (
    <View style={styles.sessionItem}>
      <TouchableOpacity
        style={styles.sessionContent}
        onPress={() => viewSessionDetails(item)}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionName}>{item.name}</Text>
          <Text style={styles.sessionDate}>{formatDate(item.startTime)}</Text>
        </View>
        <View style={styles.sessionStats}>
          <Text style={styles.sessionStat}>
            Reads: {item.beaconReads.length}
          </Text>
          <Text style={styles.sessionStat}>
            Duration: {formatDuration(item.startTime, item.endTime)}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteSession(item.id)}
      >
        <Text style={styles.deleteButtonText}>��️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBeaconRead = ({ item }: { item: BeaconRead }) => (
    <View style={styles.beaconItem}>
      <View style={styles.beaconHeader}>
        <Text style={styles.beaconUuid}>{item.uuid}</Text>
        <Text style={styles.beaconTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <View style={styles.beaconDetails}>
        <Text style={styles.beaconDetail}>Major: {item.major}</Text>
        <Text style={styles.beaconDetail}>Minor: {item.minor}</Text>
        <Text style={styles.beaconDetail}>RSSI: {item.rssi} dBm</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Sessions</Text>
        <View style={styles.placeholder} />
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved sessions</Text>
          <Text style={styles.emptySubtext}>
            Start scanning and save a session to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showSessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedSession?.name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSessionModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalStats}>
              <Text style={styles.modalStat}>
                Start: {selectedSession ? formatDate(selectedSession.startTime) : ''}
              </Text>
              <Text style={styles.modalStat}>
                End: {selectedSession?.endTime ? formatDate(selectedSession.endTime) : 'N/A'}
              </Text>
              <Text style={styles.modalStat}>
                Duration: {selectedSession ? formatDuration(selectedSession.startTime, selectedSession.endTime) : ''}
              </Text>
              <Text style={styles.modalStat}>
                Total Reads: {selectedSession?.beaconReads.length || 0}
              </Text>
            </View>

            <View style={styles.beaconListContainer}>
              <Text style={styles.beaconListTitle}>Beacon Reads</Text>
              <FlatList
                data={selectedSession?.beaconReads || []}
                renderItem={renderBeaconRead}
                keyExtractor={(item) => item.id}
                style={styles.beaconList}
                showsVerticalScrollIndicator={false}
              />
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  placeholder: {
    width: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionContent: {
    flex: 1,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionStat: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
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
    width: '90%',
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalStats: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalStat: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  beaconListContainer: {
    flex: 1,
  },
  beaconListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  beaconList: {
    flex: 1,
  },
  beaconItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  beaconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  beaconUuid: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  beaconTime: {
    fontSize: 10,
    color: '#666',
  },
  beaconDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  beaconDetail: {
    fontSize: 10,
    color: '#666',
  },
});

export default SessionsScreen;
