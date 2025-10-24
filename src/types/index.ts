export interface BeaconRead {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  timestamp: number;
}

export interface Session {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  beaconReads: BeaconRead[];
}

export interface Settings {
  targetUuid: string;
  rssiThreshold: number;
}

export interface BleManagerState {
  isScanning: boolean;
  isConnected: boolean;
  discoveredDevices: any[];
}

export interface NavigationProps {
  navigation: any;
  route: any;
}
