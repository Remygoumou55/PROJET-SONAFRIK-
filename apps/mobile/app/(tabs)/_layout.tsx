import { Tabs } from "expo-router";
import { colors } from "@sonafrik/ui/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.noirProfond,
          borderTopColor: colors.bordure,
        },
        tabBarActiveTintColor: colors.vertEnergie,
        tabBarInactiveTintColor: colors.texteDesactive,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="explorer" options={{ title: "Explorer" }} />
      <Tabs.Screen name="bibliotheque" options={{ title: "Bibliothèque" }} />
      <Tabs.Screen name="wallet" options={{ title: "Wallet" }} />
      <Tabs.Screen name="profil" options={{ title: "Profil" }} />
    </Tabs>
  );
}
