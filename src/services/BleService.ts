import BleManager from 'react-native-ble-manager';
import { PermissionsAndroid, Platform } from 'react-native';
import { BeaconRead, Settings } from '../types';
import { StorageService } from './StorageService';

export class BleService {
  private static instance: BleService;
  private isScanning = false;
  private settings: Settings | null = null;
  private onBeaconFound?: (beaconRead: BeaconRead) => void;

  private constructor() {}

  static getInstance(): BleService {
    if (!BleService.instance) {
      BleService.instance = new BleService();
    }
    return BleService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await BleManager.start({ showAlert: false });
      console.log('BLE Manager initialized');
    } catch (error) {
      console.error('Error initializing BLE Manager:', error);
      throw error;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      return Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true; // iOS permissions are handled in Info.plist
  }

  async loadSettings(): Promise<void> {
    this.settings = await StorageService.getSettings();
  }

  setBeaconFoundCallback(callback: (beaconRead: BeaconRead) => void): void {
    this.onBeaconFound = callback;
  }

  async startScanning(): Promise<void> {
    if (this.isScanning) {
      console.log('Already scanning');
      return;
    }

    await this.loadSettings();
    
    if (!this.settings) {
      throw new Error('Settings not loaded');
    }

    try {
      this.isScanning = true;
      await BleManager.scan([], 0, true);
      console.log('Started BLE scanning');
      
      // Listen for discovered devices
      BleManager.addListener('BleManagerDiscoverPeripheral', this.handlePeripheralDiscovered.bind(this));
    } catch (error) {
      this.isScanning = false;
      console.error('Error starting scan:', error);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (!this.isScanning) {
      console.log('Not currently scanning');
      return;
    }

    try {
      await BleManager.stopScan();
      this.isScanning = false;
      console.log('Stopped BLE scanning');
    } catch (error) {
      console.error('Error stopping scan:', error);
      throw error;
    }
  }

  private async handlePeripheralDiscovered(peripheral: any): Promise<void> {
    if (!this.settings || !this.onBeaconFound) {
      return;
    }

    try {
      // Check if this is an iBeacon
      const beaconData = this.parseIBeaconData(peripheral);
      if (beaconData) {
        // Check UUID filter
        if (beaconData.uuid.toLowerCase() !== this.settings.targetUuid.toLowerCase()) {
          return;
        }

        // Check RSSI threshold
        if (beaconData.rssi < this.settings.rssiThreshold) {
          return;
        }

        // Create beacon read
        const beaconRead: BeaconRead = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          uuid: beaconData.uuid,
          major: beaconData.major,
          minor: beaconData.minor,
          rssi: beaconData.rssi,
          timestamp: Date.now(),
        };

        // Store the beacon read
        await StorageService.addBeaconReadToCurrentSession(beaconRead);
        
        // Notify callback
        this.onBeaconFound(beaconRead);
      }
    } catch (error) {
      console.error('Error handling peripheral discovery:', error);
    }
  }

  private parseIBeaconData(peripheral: any): any | null {
    try {
      // iBeacon data is typically in the advertising data
      const advertisingData = peripheral.advertising || {};
      
      // Look for iBeacon manufacturer data (0x004C for Apple)
      const manufacturerData = advertisingData.manufacturerData;
      if (!manufacturerData || manufacturerData.length < 25) {
        return null;
      }

      // iBeacon format:
      // Bytes 0-1: Company ID (0x004C for Apple)
      // Bytes 2-3: iBeacon type (0x0215)
      // Bytes 4-19: UUID (16 bytes)
      // Bytes 20-21: Major (2 bytes)
      // Bytes 22-23: Minor (2 bytes)
      // Byte 24: TX Power

      if (manufacturerData[0] !== 0x4C || manufacturerData[1] !== 0x00) {
        return null; // Not Apple manufacturer data
      }

      if (manufacturerData[2] !== 0x02 || manufacturerData[3] !== 0x15) {
        return null; // Not iBeacon type
      }

      // Extract UUID (bytes 4-19)
      const uuidBytes = manufacturerData.slice(4, 20);
      const uuid = this.bytesToUUID(uuidBytes);

      // Extract Major (bytes 20-21)
      const major = (manufacturerData[20] << 8) | manufacturerData[21];

      // Extract Minor (bytes 22-23)
      const minor = (manufacturerData[22] << 8) | manufacturerData[23];

      return {
        uuid,
        major,
        minor,
        rssi: peripheral.rssi || 0,
      };
    } catch (error) {
      console.error('Error parsing iBeacon data:', error);
      return null;
    }
  }

  private bytesToUUID(bytes: number[]): string {
    const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32),
    ].join('-').toUpperCase();
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  async getBluetoothState(): Promise<string> {
    try {
      return await BleManager.checkState();
    } catch (error) {
      console.error('Error checking Bluetooth state:', error);
      return 'unknown';
    }
  }
}
