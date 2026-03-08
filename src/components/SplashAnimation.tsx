import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View, StyleSheet, Image, Dimensions } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface SplashAnimationProps {
    children: React.ReactNode;
}

export function SplashAnimation({ children }: SplashAnimationProps) {
    const theme = useTheme();
    const [isDone, setIsDone] = useState(false);

    // Animation values
    const scaleAnim = useRef(new Animated.Value(5)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Run Stomp Sequence!
        Animated.sequence([
            // 1. Scale in linearly — equal speed start to finish
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            // 2. Pause
            Animated.delay(550),
            // 3. Fade out
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Sequence completed, unmount the splash overlay!
            setIsDone(true);
        });
    }, [scaleAnim, opacityAnim]);

    return (
        <View style={styles.container}>
            {/* The rest of the app always renders instantly underneath */}
            {children}

            {/* If the animation isn't completely done, render the overlay */}
            {!isDone && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFillObject,
                        {
                            backgroundColor: theme.bg,
                            justifyContent: "center",
                            alignItems: "center",
                            opacity: opacityAnim,
                            zIndex: 99999, // Ensure it covers everything
                        },
                    ]}
                >
                    <Animated.Image
                        source={require("../../ikkii.png")}
                        style={{
                            width: Dimensions.get("window").width * 0.5,
                            height: Dimensions.get("window").width * 0.5,
                            transform: [{ scale: scaleAnim }],
                        }}
                        resizeMode="contain"
                    />
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
