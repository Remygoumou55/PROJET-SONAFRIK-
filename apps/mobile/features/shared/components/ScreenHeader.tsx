import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@sonafrik/ui/tokens";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  rightIcon?: string;
  onRightPress?: () => void;
};

export function ScreenHeader({ title, subtitle, rightIcon, onRightPress }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.text}>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      {rightIcon && onRightPress ? (
        <Pressable style={styles.action} onPress={onRightPress} hitSlop={12}>
          <Text style={styles.actionText}>{rightIcon}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  text: { flex: 1 },
  subtitle: { color: colors.texteSecondaire, fontSize: 13, marginBottom: 2 },
  title: { color: colors.textePrincipal, fontSize: 22, fontWeight: "700" },
  action: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: colors.vertEnergie, fontSize: 16, fontWeight: "700" },
});
