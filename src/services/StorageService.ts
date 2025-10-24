import AsyncStorage from '@react-native-async-storage/async-storage';
import { BeaconRead, Session, Settings } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'ble_beacon_settings',
  SESSIONS: 'ble_beacon_sessions',
  CURRENT_SESSION: 'ble_beacon_current_session',
};

export class StorageService {
  // Settings management
  static async getSettings(): Promise<Settings> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settings) {
        return JSON.parse(settings);
      }
      // Return default settings
      return {
        targetUuid: 'E101B392ADA32224231605EF58774925',
        rssiThreshold: -70,
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        targetUuid: 'E101B392ADA32224231605EF58774925',
        rssiThreshold: -70,
      };
    }
  }

  static async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Session management
  static async getSessions(): Promise<Session[]> {
    try {
      const sessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  static async saveSession(session: Session): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filteredSessions));
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // Current session management
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const session = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  static async saveCurrentSession(session: Session | null): Promise<void> {
    try {
      if (session) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      }
    } catch (error) {
      console.error('Error saving current session:', error);
      throw error;
    }
  }

  // Beacon read management
  static async addBeaconReadToCurrentSession(beaconRead: BeaconRead): Promise<void> {
    try {
      const currentSession = await this.getCurrentSession();
      if (currentSession) {
        currentSession.beaconReads.push(beaconRead);
        await this.saveCurrentSession(currentSession);
      }
    } catch (error) {
      console.error('Error adding beacon read to current session:', error);
      throw error;
    }
  }
}
