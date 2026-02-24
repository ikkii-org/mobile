import { Buffer } from "buffer";

// Buffer polyfill required by @solana/web3.js
// React Native 0.71+ with Hermes already exposes globalThis.crypto.getRandomValues
// natively, so no additional getRandomValues polyfill is needed.
global.Buffer = Buffer;
