import "../global.css";

import { Stack } from "expo-router";
import { WalletProvider } from "../components/WalletProvider";
import { ToastProvider } from "../contexts/ToastContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { SplashAnimation } from "../components/SplashAnimation";

function ThemedStack() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
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
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <ToastProvider>
            <SplashAnimation>
              <ThemedStack />
            </SplashAnimation>
          </ToastProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
