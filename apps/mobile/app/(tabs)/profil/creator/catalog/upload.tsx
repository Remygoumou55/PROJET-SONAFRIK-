import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { colors } from "@sonafrik/ui/tokens";
import { ScreenHeader } from "../../../../../features/shared/components/ScreenHeader";
import { useCreatorService } from "../../../../../features/creator/useCreator";
import { useCatalogService } from "../../../../../features/catalog/useCatalog";

const AUDIO_MIME = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/aac": "aac",
  "audio/mp4": "aac",
} as const;

type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

export default function UploadTrackScreen() {
  const router = useRouter();
  const creator = useCreatorService();
  const catalog = useCatalogService();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function pickAudio() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/aac", "audio/mp4"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const picked: PickedFile = {
        uri: asset.uri,
        name: asset.name ?? "audio",
        mimeType: asset.mimeType ?? "audio/mpeg",
        size: asset.size,
      };
      setFile(picked);
      setTitle((prev) => (prev ? prev : picked.name.replace(/\.[^.]+$/, "")));

      const { sound } = await Audio.Sound.createAsync(
        { uri: picked.uri },
        { shouldPlay: false },
      );
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setDuration(Math.round(status.durationMillis / 1000));
      }
      await sound.unloadAsync();
    } catch {
      Alert.alert("Erreur", "Impossible de lire le fichier audio.");
    }
  }

  async function handleSubmit() {
    if (!file || !title.trim()) {
      Alert.alert("Champs manquants", "Choisis un fichier et un titre.");
      return;
    }
    const format = AUDIO_MIME[file.mimeType as keyof typeof AUDIO_MIME] ?? "mp3";
    if (!file.size) {
      Alert.alert("Erreur", "Taille du fichier inconnue.");
      return;
    }

    setLoading(true);
    try {
      const context = await creator.getCreatorContext();
      const track = await catalog.createTrack({
        title: title.trim(),
        durationSeconds: duration || undefined,
      });

      const { signedUrl, path } = await catalog.requestAssetUploadUrl({
        creatorId: context.creator.id,
        assetType: "audio",
        contentType: file.mimeType ?? "audio/mpeg",
        trackId: track.id,
        format,
      });

      const response = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.mimeType ?? "audio/mpeg" },
        body: await uriToBlob(file.uri),
      });
      if (!response.ok) throw new Error("upload_failed");

      await catalog.confirmAssetUpload({
        creatorId: context.creator.id,
        trackId: track.id,
        path,
        format,
        contentType: file.mimeType ?? "audio/mpeg",
        fileSizeBytes: file.size,
        durationSeconds: duration || undefined,
      });

      Alert.alert("Morceau importé", "Le morceau est en cours de traitement.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  }

  async function uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return response.blob();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title="Importer un morceau" />

      <Pressable style={styles.fileBox} onPress={pickAudio}>
        {file ? (
          <View>
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <Text style={styles.fileMeta}>
              {formatDuration(duration)} · {formatBytes(file.size ?? 0)} · {file.mimeType}
            </Text>
          </View>
        ) : (
          <Text style={styles.fileHint}>+ Choisir un fichier audio</Text>
        )}
      </Pressable>

      <Text style={styles.label}>Titre</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Titre du morceau"
        placeholderTextColor={colors.texteDesactive}
      />

      <Pressable style={[styles.submit, loading && styles.submitDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.noirProfond} />
        ) : (
          <Text style={styles.submitText}>Importer</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: colors.noirProfond },
  fileBox: {
    borderWidth: 1,
    borderColor: colors.bordure,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: colors.surface,
  },
  fileName: { color: colors.textePrincipal, fontSize: 15, fontWeight: "600" },
  fileMeta: { color: colors.texteSecondaire, marginTop: 6, fontSize: 12 },
  fileHint: { color: colors.vertEnergie, fontSize: 15, fontWeight: "600" },
  label: { color: colors.texteSecondaire, marginBottom: 8, fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.bordure,
    borderRadius: 10,
    padding: 14,
    color: colors.textePrincipal,
    marginBottom: 20,
  },
  submit: {
    backgroundColor: colors.vertEnergie,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.noirProfond, fontWeight: "700", fontSize: 15 },
});
