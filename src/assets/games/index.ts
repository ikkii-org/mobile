import { ImageSourcePropType } from "react-native";

/** Local game icon assets, keyed by SUPPORTED_GAMES[].name */
export const GAME_ICONS: Record<string, ImageSourcePropType> = {
    "Clash Royale": require("./clash-royale.png"),
    "Valorant": require("./valorant.png"),
    "Apex Legends": require("./apex-legends.png"),
    "CS2": require("./cs2.png"),
};
