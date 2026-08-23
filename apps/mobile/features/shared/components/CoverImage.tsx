import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@sonafrik/ui/tokens";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

function buildSrc(path: string): string {
  return path.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/catalog-visuals/${path}`;
}

function initials(label: string): string {
  const words = label.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const second = words[1]?.[0] ?? "";
  return (first + second).toUpperCase().slice(0, 2);
}

const GRADIENTS = [
  colors.vertEnergie,
  colors.vertProfond,
  colors.orSolaire,
  colors.orProfond,
] as const;

function gradientFor(label: string): string {
  const index = label.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[index] ?? colors.vertEnergie;
}

type CoverImageProps = {
  coverPath: string | null | undefined;
  label?: string;
  size: number;
  borderRadius?: number;
  round?: boolean;
};

export function CoverImage({ coverPath, label = "", size, borderRadius = 10, round = false }: CoverImageProps) {
  const [error, setError] = useState(false);
  const radius = round ? size / 2 : borderRadius;
  const letter = initials(label || "SONAFRIK");
  const bg = gradientFor(label || "SONAFRIK");
  const src = coverPath ? buildSrc(coverPath) : null;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: radius, backgroundColor: colors.elevated }]}>
      {src && !error ? (
        <Image
          source={{ uri: src }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="cover"
          onError={() => setError(true)}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: radius, backgroundColor: bg }]}>
          <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{letter}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
  fallback: { alignItems: "center", justifyContent: "center" },
  letter: { color: colors.blanc80, fontWeight: "800" },
});
