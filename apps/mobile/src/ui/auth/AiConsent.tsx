import { useAuthConfig } from "@agenteschat/client";
import { openBrowserAsync } from "expo-web-browser";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import { signOut } from "@/features/account";
import { readValueSync, STORED, writeValueSync } from "@/lib/storage";
import { Button } from "../Button";
import { Text } from "../Text";
import { useTheme } from "../theme";
import { AuthScaffold } from "./AuthScaffold";

/**
 * Once per person signed in on this phone, before anything else: what reaches the AI providers that answer for the
 * agents, and an explicit "Concordo" (Apple's App Review Guideline 5.1.2(i) asks for that permission before personal
 * data goes to a third-party AI). "Sair" is the way out. Remembered in `STORED.aiConsent`, cleared on sign-out.
 */
export function AiConsent() {
  const [given, setGiven] = useState(() => readValueSync(STORED.aiConsent) === "1");
  const [leaving, setLeaving] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const privacyUrl = useAuthConfig().data?.privacyUrl;
  if (given) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} accessibilityViewIsModal>
      <AuthScaffold title={t("mobile.aiConsent.title")} subtitle={t("mobile.aiConsent.lead")}>
        <Text tone="muted">{t("mobile.aiConsent.providers")}</Text>
        <Text tone="muted">{t("mobile.aiConsent.choice")}</Text>
        {privacyUrl ? (
          <Text
            tone="muted"
            style={{ textDecorationLine: "underline" }}
            accessibilityRole="link"
            onPress={() => void openBrowserAsync(privacyUrl).catch(() => Linking.openURL(privacyUrl))}
          >
            {t("mobile.aiConsent.privacy")}
          </Text>
        ) : null}
        <Button
          variant="primary"
          wide
          label={t("mobile.aiConsent.agree")}
          disabled={leaving}
          onPress={() => {
            writeValueSync(STORED.aiConsent, "1");
            setGiven(true);
          }}
        />
        <Button
          variant="ghost"
          wide
          label={t("mobile.org.signOut")}
          loading={leaving}
          disabled={leaving}
          onPress={() => {
            setLeaving(true);
            void signOut().finally(() => setLeaving(false));
          }}
        />
      </AuthScaffold>
    </View>
  );
}
