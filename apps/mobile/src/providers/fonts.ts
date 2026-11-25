import { useFonts } from "expo-font";
import { fonts } from "@/ui/theme";

/**
 * xquads' face, Onest (DESIGN.md), for large titles and every count, at its default instance. Body and UI text use
 * the system font. The family name is `fonts.display` in the theme. SIL Open Font License (assets/fonts/OFL-onest.txt).
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fonts.display]: require("../../assets/fonts/Onest.ttf"),
  });
  // A font that fails to load falls back to the system font: never block the app on it.
  return loaded || Boolean(error);
}
