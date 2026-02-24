import { StatusBar } from "expo-status-bar";
import { Platform, Pressable, Text, View } from "react-native";
import { useWallet } from "../components/WalletProvider";

function truncate(pk: string) {
  return `${pk.slice(0, 6)}...${pk.slice(-6)}`;
}

export default function App() {
  const { connected, publicKey, balanceSol, loadingBalance, connect, disconnect, refreshBalance } = useWallet();
  const isAndroid = Platform.OS === "android";

  return (
    <View className="flex-1 bg-[#0b0c14] items-center justify-center px-6">
      <StatusBar style="light" />

      {/* ── Brand ── */}
      <Text className="text-5xl font-black text-white tracking-widest mb-1">
        IKKII
      </Text>
      <Text className="text-xs text-[#9945FF] font-semibold tracking-[4px] uppercase mb-10">
        Solana Wallet
      </Text>

      {/* ── Card ── */}
      <View className="w-full max-w-sm bg-[#13141f] border border-[#1e2030] rounded-3xl p-6">

        {/* Top row: network pill + status */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-2 bg-[#1a1b2e] border border-[#2a2b45] rounded-full px-3 py-1.5">
            <View className="w-2 h-2 rounded-full bg-[#9945FF]" />
            <Text className="text-[#9945FF] text-xs font-bold">Devnet</Text>
          </View>

          <View
            className={`flex-row items-center gap-2 rounded-full px-3 py-1.5 ${connected
              ? "bg-emerald-950 border border-emerald-800"
              : "bg-[#1a1b2e] border border-[#2a2b45]"
              }`}
          >
            <View
              className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-500"
                }`}
            />
            <Text
              className={`text-xs font-bold ${connected ? "text-emerald-400" : "text-zinc-500"
                }`}
            >
              {connected ? "Connected" : "Disconnected"}
            </Text>
          </View>
        </View>

        {/* Wallet address box */}
        <View className="bg-[#0d0e1a] rounded-2xl p-4 mb-6 border border-[#1e2030]">
          <Text className="text-zinc-500 text-xs mb-2 uppercase tracking-widest">
            Wallet Address
          </Text>
          {connected && publicKey ? (
            <Text className="text-white font-mono text-sm tracking-wide">
              {truncate(publicKey.toBase58())}
            </Text>
          ) : (
            <View className="flex-row gap-1 items-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} className="h-2 w-6 rounded bg-[#1e2030]" />
              ))}
            </View>
          )}
        </View>

        {/* Stats row */}
        <View className="flex-row justify-between mb-6">
          {/* SOL Balance — tappable to refresh */}
          <Pressable
            onPress={connected ? refreshBalance : undefined}
            className="items-center flex-1 active:opacity-60"
          >
            <Text className="text-white font-bold text-lg">
              {connected
                ? loadingBalance
                  ? "···"
                  : balanceSol !== null
                    ? `${balanceSol.toFixed(4)}`
                    : "—"
                : "···"}
            </Text>
            <Text className="text-zinc-500 text-[10px] mt-0.5">
              {connected && !loadingBalance ? "SOL ↻" : "SOL Balance"}
            </Text>
          </Pressable>

          {/* Tokens */}
          <View className="items-center flex-1">
            <Text className="text-white font-bold text-lg">{connected ? "—" : "···"}</Text>
            <Text className="text-zinc-500 text-[10px] mt-0.5">Tokens</Text>
          </View>

          {/* NFTs */}
          <View className="items-center flex-1">
            <Text className="text-white font-bold text-lg">{connected ? "—" : "···"}</Text>
            <Text className="text-zinc-500 text-[10px] mt-0.5">NFTs</Text>
          </View>
        </View>

        {/* ── CTA ── */}
        {isAndroid ? (
          <Pressable
            onPress={connected ? disconnect : connect}
            className={`w-full py-4 rounded-2xl items-center active:opacity-75 ${connected
              ? "bg-[#1e2030] border border-red-800"
              : "bg-[#9945FF]"
              }`}
          >
            <Text
              className={`font-bold text-base tracking-wide ${connected ? "text-red-400" : "text-white"
                }`}
            >
              {connected ? "Disconnect Wallet" : "Connect Wallet"}
            </Text>
          </Pressable>
        ) : (
          <View className="w-full py-4 rounded-2xl items-center bg-[#0d0e1a] border border-[#1e2030]">
            <Text className="text-zinc-500 text-xs text-center leading-5">
              Wallet connection requires Android{"\n"}with a MWA-compatible wallet installed.
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <Text className="text-zinc-600 text-xs mt-8">
        Powered by Solana Mobile Wallet Adapter
      </Text>
    </View>
  );
}
