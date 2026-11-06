// App entry. Runs before any screen or library code.
// 1. Development-only log filters (must load before expo-notifications).
import './src/dev/silence-expo-go-warnings';
// 2. Start Expo Router (the default entry).
import 'expo-router/entry';
