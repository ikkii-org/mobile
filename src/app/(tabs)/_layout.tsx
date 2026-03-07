import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_CONFIG: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
}[] = [
    { icon: "flash", label: "Arena" },
    { icon: "add-circle", label: "Duel" },
    { icon: "wallet", label: "Vault" },
    { icon: "trophy", label: "Ranks" },
    { icon: "person", label: "Profile" },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{
                flexDirection: "row",
                backgroundColor: theme.tabBarBg,
                borderTopWidth: 1,
                borderTopColor: theme.tabBarBorder,
                paddingBottom: insets.bottom,
            }}
        >
            {state.routes.map((route, index) => {
                const focused = state.index === index;
                const config = TAB_CONFIG[index];
                const color = focused ? theme.tabBarActive : theme.tabBarInactive;

                return (
                    <Pressable
                        key={route.key}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            if (!focused) {
                                navigation.navigate(route.name);
                            }
                        }}
                        style={{
                            flex: 1,
                            alignItems: "center",
                            paddingTop: 14,
                            paddingBottom: 10,
                        }}
                    >
                        {/* Top accent bar — spans full cell width */}
                        <View
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                backgroundColor: focused ? theme.accent : "transparent",
                            }}
                        />

                        <Ionicons name={config.icon} size={28} color={color} />

                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: focused ? "600" : "400",
                                color,
                                marginTop: 4,
                            }}
                        >
                            {config.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="create" />
            <Tabs.Screen name="wallet" />
            <Tabs.Screen name="leaderboard" />
            <Tabs.Screen name="profile" />
        </Tabs>
    );
}
