import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { Icon, Text } from "@/ui";
import { useColors } from "../shared/hooks";

/**
 * The next message suggested in a DM with an agent (ADR 0220), over the field as the "Respondendo a" bar sits: a tap
 * puts it in the field, to change or send. The web's grey text in the empty box, for a phone with no Tab.
 */
export function SuggestionBar({ text, onUse }: { text: string; onUse: () => void }) {
  const { t } = useTranslation();
  const c = useColors();
  return (
    <Pressable
      onPress={onUse}
      accessibilityRole="button"
      accessibilityLabel={t("channel.useSuggestion", { text })}
      style={({ pressed }) => [styles.bar, { backgroundColor: c.sunken }, pressed && styles.pressed]}
    >
      <Icon name="bulb" size={16} color={c.muted} />
      <Text variant="footnote" tone="ink2" numberOfLines={1} style={styles.text}>
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 32,
    marginBottom: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  pressed: { opacity: 0.6 },
  text: { flex: 1 },
});
