import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

function TabIcon({
    name,
    color,
    focused,
    label,
}: {
    name: keyof typeof Ionicons.glyphMap;
    color: string;
    focused: boolean;
    label: string;
}) {
    const theme = useTheme();
    return (
        <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 6 }}>
            <View
                style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: 48,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: focused ? theme.accentBg : "transparent",
                    borderWidth: focused ? 1 : 0,
                    borderColor: focused ? theme.borderGlow : "transparent",
                    shadowColor: focused ? theme.accent : "transparent",
                    shadowOpacity: focused ? 0.6 : 0,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                }}
            >
                <Ionicons name={name} size={22} color={color} />
            </View>
            <Text
                style={{
                    fontSize: 9,
                    fontWeight: "700",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color,
                    marginTop: 3,
                }}
            >
                {label}
            </Text>
        </View>
    );
}

export default function TabLayout() {
    const theme = useTheme();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: theme.tabBarBg,
                    borderTopColor: theme.tabBarBorder,
                    borderTopWidth: 1,
                    height: 76,
                    paddingBottom: 0,
                    paddingTop: 0,
                    paddingHorizontal: 4,
                    elevation: 0,
                    shadowColor: theme.accent,
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: -4 },
                },
                tabBarActiveTintColor: theme.tabBarActive,
                tabBarInactiveTintColor: theme.tabBarInactive,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="flash" color={color} focused={focused} label="Arena" />
                    ),
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="add-circle" color={color} focused={focused} label="Duel" />
                    ),
                }}
            />
            <Tabs.Screen
                name="wallet"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="wallet" color={color} focused={focused} label="Vault" />
                    ),
                }}
            />
            <Tabs.Screen
                name="leaderboard"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="trophy" color={color} focused={focused} label="Ranks" />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="person" color={color} focused={focused} label="Profile" />
                    ),
                }}
            />
        </Tabs>
    );
}
