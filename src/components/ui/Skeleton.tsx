import React, { useEffect, useRef } from "react";
import { Animated, View, type DimensionValue } from "react-native";

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    className?: string;
}

export function Skeleton({
    width = "100%",
    height = 16,
    borderRadius = 8,
    className = "",
}: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <View className={className}>
            <Animated.View
                style={{
                    width,
                    height,
                    borderRadius,
                    backgroundColor: "#1E2030",
                    opacity,
                }}
            />
        </View>
    );
}
