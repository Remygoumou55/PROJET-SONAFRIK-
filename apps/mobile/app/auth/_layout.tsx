import { Stack } from "expo-router";
import { colors } from "@sonafrik/ui/tokens";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.noirProfond },
        headerTintColor: colors.textePrincipal,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: colors.noirProfond },
      }}
    />
  );
}
