import { useColorScheme } from "react-native";
import { useAppStore } from "../store/useAppStore";
export const palettes = {
  light: {
    background: "#F6F5F1",
    surface: "#FFFFFF",
    button: "#E7E8F5",
    buttonBorder: "#C9CCE8",
    text: "#202631",
    muted: "#697382",
    border: "#E3E4E7",
    primary: "#5D5AE8",
    soft: "#ECEBFF",
    danger: "#B62F48",
  },
  dark: {
    background: "#15171C",
    surface: "#20242C",
    button: "#34364F",
    buttonBorder: "#55597A",
    text: "#F3F4F8",
    muted: "#A3ADBD",
    border: "#343A46",
    primary: "#ABA7FF",
    soft: "#343157",
    danger: "#FF91A7",
  },
};
export function useTheme() {
  const system = useColorScheme();
  const mode = useAppStore((s) => s.theme);
  const dark = (mode === "system" ? system : mode) === "dark";
  return { ...palettes[dark ? "dark" : "light"], dark };
}
