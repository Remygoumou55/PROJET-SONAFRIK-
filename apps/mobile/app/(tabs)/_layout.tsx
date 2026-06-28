import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@sonafrik/ui/tokens";
import { PlayerProvider, usePlayerContext } from "../../features/streaming/PlayerContext";
import { getSupabaseMobileClient } from "../../lib/supabase";

const TAB_BAR_BASE_HEIGHT = 56;

function MiniPlayerBar({ bottomOffset }: { bottomOffset: number }) {
  const { currentTrack, isPlaying, pause, resume } = usePlayerContext();
  if (!currentTrack) return null;

  return (
    <View style={[styles.miniPlayer, { bottom: bottomOffset }]}>
      <View style={styles.miniInfo}>
        <Text style={styles.miniTitle} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        {currentTrack.artist_name ? (
          <Text style={styles.miniArtist} numberOfLines={1}>
            {currentTrack.artist_name}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={isPlaying ? pause : resume}
        style={styles.miniBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "Mettre en pause" : "Lire"}
      >
        <Text style={styles.miniBtnText}>{isPlaying ? "⏸" : "▶"}</Text>
      </Pressable>
    </View>
  );
}

function TabsInner() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const miniPlayerBottom = tabBarHeight + 8;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.noirProfond,
            borderTopColor: colors.bordure,
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, 6),
            paddingTop: 6,
          },
          tabBarActiveTintColor: colors.vertEnergie,
          tabBarInactiveTintColor: colors.texteDesactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Accueil" }} />
        <Tabs.Screen name="explorer" options={{ title: "Explorer" }} />
        <Tabs.Screen name="bibliotheque" options={{ title: "Bibliothèque" }} />
        <Tabs.Screen name="wallet" options={{ title: "Wallet" }} />
        <Tabs.Screen name="profil" options={{ title: "Profil" }} />
      </Tabs>
      <MiniPlayerBar bottomOffset={miniPlayerBottom} />
    </>
  );
}

export default function TabsLayout() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseMobileClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setSessionChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!sessionChecked) return null;
  if (!hasSession) return <Redirect href="/auth/connexion" />;

  return (
    <PlayerProvider>
      <TabsInner />
    </PlayerProvider>
  );
}

const styles = StyleSheet.create({
  miniPlayer: {
    position: "absolute",
    left: 10,
    right: 10,
    backgroundColor: colors.elevated,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.bordure,
    shadowColor: "black",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  miniInfo: { flex: 1, marginRight: 12 },
  miniTitle: { color: colors.textePrincipal, fontSize: 13, fontWeight: "600" },
  miniArtist: { color: colors.texteSecondaire, fontSize: 11, marginTop: 2 },
  miniBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.vertEnergie,
    alignItems: "center",
    justifyContent: "center",
  },
  miniBtnText: { fontSize: 14, color: colors.noirProfond },
});
