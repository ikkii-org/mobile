import "../../polyfill";
import "../global.css";

import { Stack } from "expo-router";
import { WalletProvider } from "../components/WalletProvider";
import { ToastProvider } from "../contexts/ToastContext";

export default function RootLayout() {
  return (
    <WalletProvider>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0A0A0F" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="duel/[id]" />
          <Stack.Screen name="user/[username]" />
        </Stack>
      </ToastProvider>
    </WalletProvider>
  );
}
