import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { colors } from "@sonafrik/ui/tokens";
import { PlayerProvider, usePlayerContext } from "../../features/streaming/PlayerContext";

function MiniPlayerBar() {
  const { currentTrack, isPlaying, pause, resume } = usePlayerContext();
  if (!currentTrack) return null;

  return (
    <View style={styles.miniPlayer}>
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
      >
        <Text style={styles.miniBtnText}>{isPlaying ? "⏸" : "▶"}</Text>
      </Pressable>
    </View>
  );
}

function TabsInner() {
  return (
    <>
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
      <MiniPlayerBar />
    </>
  );
}

export default function TabsLayout() {
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
    bottom: 62,
    backgroundColor: colors.elevated,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.bordure,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  miniInfo: { flex: 1, marginRight: 12 },
  miniTitle: { color: colors.textePrincipal, fontSize: 13, fontWeight: "600" },
  miniArtist: { color: colors.texteSecondaire, fontSize: 11, marginTop: 2 },
  miniBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.vertEnergie,
    alignItems: "center",
    justifyContent: "center",
  },
  miniBtnText: { fontSize: 14, color: colors.noirProfond },
});
