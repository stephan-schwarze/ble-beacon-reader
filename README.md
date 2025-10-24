# BLE Beacon Reader

A React Native mobile application for reading BLE beacon advertising packages using the iBeacon protocol.

## Features

- **iBeacon Protocol Support**: Reads beacons that advertise with the iBeacon protocol
- **UUID Filtering**: Only stores reads from beacons with a specified UUID
- **RSSI Threshold**: Configurable RSSI threshold (default: -70dBm)
- **Session Management**: Start/stop scanning and save sessions with custom names
- **Local Storage**: Stores beacon reads locally using AsyncStorage
- **Data Persistence**: View and manage saved sessions

## Data Stored

For each BLE read, the application stores:
- UUID
- Major
- Minor
- RSSI
- Timestamp

## Default Settings

- **Default UUID**: `E101B392ADA32224231605EF58774925`
- **Default RSSI Threshold**: `-70dBm`

## Prerequisites

- Node.js (v14 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Physical device (BLE scanning requires physical hardware)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ble-beacon-reader
```

2. Install dependencies:
```bash
npm install
```

3. For iOS, install CocoaPods dependencies:
```bash
cd ios && pod install && cd ..
```

## Running the App

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## Permissions

### Android
The app requires the following permissions (automatically requested):
- `BLUETOOTH`
- `BLUETOOTH_ADMIN`
- `BLUETOOTH_CONNECT`
- `BLUETOOTH_SCAN`
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`

### iOS
The app requires the following permissions (automatically requested):
- Location access (When In Use)
- Bluetooth access

## Usage

1. **Start Scanning**: Tap "Start Scanning" to begin detecting iBeacon devices
2. **Configure Settings**: Tap the settings icon (⚙️) to:
   - Set target UUID
   - Adjust RSSI threshold
3. **Save Sessions**: Tap "Save Session" to save current beacon reads with a custom name
4. **View Sessions**: Tap the sessions icon (📋) to view and manage saved sessions
5. **Stop Scanning**: Tap "Stop Scanning" to halt beacon detection

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # App screens
│   ├── ScanningScreen.tsx
│   ├── SettingsScreen.tsx
│   └── SessionsScreen.tsx
├── services/           # Business logic
│   ├── BleService.ts
│   └── StorageService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Utility functions
```

## Key Components

- **BleService**: Handles BLE scanning and iBeacon parsing
- **StorageService**: Manages local data persistence
- **ScanningScreen**: Main interface for beacon scanning
- **SettingsScreen**: Configuration interface
- **SessionsScreen**: Session management interface

## Troubleshooting

### Bluetooth Issues
- Ensure Bluetooth is enabled on the device
- Grant all required permissions
- Use a physical device (BLE scanning doesn't work in simulators)

### Permission Issues
- Check that location services are enabled
- Verify Bluetooth permissions are granted
- On Android, ensure location services are enabled

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- For iOS, run `cd ios && pod install`
- Clear Metro cache: `npx react-native start --reset-cache`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
