import "react-native-get-random-values";
import { Buffer } from "buffer";

// Buffer polyfill required by @solana/web3.js
// react-native-get-random-values provides crypto.getRandomValues() for MWA
global.Buffer = Buffer;
