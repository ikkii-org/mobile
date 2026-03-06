// This file is the true JS bundle entry point.
// It MUST polyfill globals before expo-router loads any app code,
// because @solana/web3.js and @solana/spl-token access Buffer at module
// evaluation time (before any component renders).
import "react-native-get-random-values";
import { Buffer } from "buffer";
global.Buffer = Buffer;

// Hand off to expo-router's normal entry
import "expo-router/entry";
