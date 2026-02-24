import "../../polyfill";
import "../global.css";

import { Slot } from "expo-router";
import { WalletProvider } from "../components/WalletProvider";

export default function Layout() {
  return (
    <WalletProvider>
      <Slot />
    </WalletProvider>
  );
}
