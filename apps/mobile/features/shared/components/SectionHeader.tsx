import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@sonafrik/ui/tokens";

type SectionHeaderProps = {
  title: string;
  action?: { label: string; onPress: () => void } | null;
};

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={styles.action}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { color: colors.textePrincipal, fontSize: 17, fontWeight: "700", flex: 1, marginRight: 8 },
  action: { color: colors.orSolaire, fontSize: 13, fontWeight: "600" },
});
