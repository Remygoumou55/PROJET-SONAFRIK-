import { Stack } from "expo-router";
import { colors } from "@sonafrik/ui/tokens";

export default function ProfilLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.noirProfond },
        headerTintColor: colors.vertEnergie,
        headerTitleStyle: { color: colors.textePrincipal },
        contentStyle: { backgroundColor: colors.noirProfond },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Profil" }} />
      <Stack.Screen name="edit" options={{ title: "Modifier" }} />
      <Stack.Screen name="preferences" options={{ title: "Préférences" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="sessions" options={{ title: "Sessions" }} />
      <Stack.Screen name="account" options={{ title: "Compte" }} />
      <Stack.Screen name="creator/index" options={{ title: "Creator OS" }} />
      <Stack.Screen name="creator/identity" options={{ title: "Identité artiste" }} />
      <Stack.Screen name="creator/verification" options={{ title: "Vérification" }} />
      <Stack.Screen name="creator/labels" options={{ title: "Labels" }} />
      <Stack.Screen name="creator/team" options={{ title: "Équipe" }} />
      <Stack.Screen name="creator/catalog/index" options={{ title: "Catalogue" }} />
      <Stack.Screen name="creator/catalog/releases" options={{ title: "Sorties" }} />
      <Stack.Screen name="creator/catalog/tracks" options={{ title: "Morceaux" }} />
    </Stack>
  );
}
