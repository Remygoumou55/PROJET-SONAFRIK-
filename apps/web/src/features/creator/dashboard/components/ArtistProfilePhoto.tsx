"use client";

import { useCallback, useState } from "react";
import { invalidateCreatorAssetUrl } from "@/lib/image/creator-asset-url-cache";
import { useCreatorService } from "../../hooks/useCreator";
import {
  resolveCreatorIdForUpload,
  resolveCreatorUploadError,
  useEffectiveCreatorId,
} from "../../hooks/useEffectiveCreatorId";
import { publishArtistProfileUpdate } from "@/features/creator/identity/lib/publishArtistProfileUpdate";
import { uploadAssetToSignedUrl } from "@/lib/upload/uploadAsset";
import { CreatorAssetImage } from "./CreatorAssetImage";
import {
  AUTO_IMAGE_VARIANTS,
  type AutoImagePrepared,
} from "@/features/shared/media/autoImagePipeline";
import { useAutoImageUpload } from "@/features/shared/media/useAutoImageUpload";

interface ArtistProfilePhotoProps {
  creatorId: string;
  stageName: string;
  photoPath: string | null;
}

export function ArtistProfilePhoto({
  creatorId: creatorIdProp,
  stageName,
  photoPath,
}: ArtistProfilePhotoProps) {
  const { creatorId: displayCreatorId, resolving } = useEffectiveCreatorId(creatorIdProp);
  const creatorService = useCreatorService();

  const [localPhotoPath, setLocalPhotoPath] = useState(photoPath);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const initials = stageName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const uploadAvatar = useCallback(async (prepared: AutoImagePrepared) => {
    try {
      const creatorId = await resolveCreatorIdForUpload(creatorService, creatorIdProp);
      const { signedUrl, token, path } =
        await creatorService.requestAssetUploadUrl({
          creatorId,
          assetKind: "gallery",
          contentType: prepared.contentType,
        });
      await uploadAssetToSignedUrl(signedUrl, prepared.file, {
        contentType: prepared.contentType,
        token,
      });

      await creatorService.saveAvatarCrop({
        creatorId,
        croppedPath: path,
        originalPath: path,
        cropX: 0,
        cropY: 0,
        cropZoom: 1,
      });

      invalidateCreatorAssetUrl(creatorId);
      setLocalPhotoPath(path);
      publishArtistProfileUpdate(creatorId);
    } catch (err) {
      throw new Error(resolveCreatorUploadError(err, "Échec de l'enregistrement de l'avatar."));
    }
  }, [creatorIdProp, creatorService]);

  const {
    inputRef,
    uploading,
    error: uploadError,
    success,
    accept,
    openFilePicker,
    handleInputChange,
  } = useAutoImageUpload({
    variant: AUTO_IMAGE_VARIANTS.avatar,
    onUpload: uploadAvatar,
    successMessage: "Avatar mis à jour.",
  });

  const handleRemove = useCallback(async () => {
    setRemoving(true);
    setRemoveError(null);
    try {
      const creatorId = await resolveCreatorIdForUpload(creatorService, creatorIdProp);
      await creatorService.removeProfilePhoto(creatorId);
      invalidateCreatorAssetUrl(creatorId);
      setLocalPhotoPath(null);
      publishArtistProfileUpdate(creatorId);
    } catch (err) {
      setRemoveError(resolveCreatorUploadError(err, "Impossible de supprimer la photo."));
    } finally {
      setRemoving(false);
    }
  }, [creatorIdProp, creatorService]);

  const error = removeError ?? uploadError;
  const busy = uploading || removing;

  return (
    <>
      <div className="ahero__avatar-wrap">
        <button
          type="button"
          className="ahero__avatar ahero__avatar-button"
          onClick={openFilePicker}
          disabled={busy || resolving}
          aria-label="Changer l'avatar"
        >
          {localPhotoPath ? (
            <CreatorAssetImage
              creatorId={displayCreatorId}
              path={localPhotoPath}
              assetKind="gallery"
              alt={stageName}
              layout="bounded"
              priority
              fallback={
                <span className="ahero__avatar-initials" aria-hidden="true">
                  {initials || "🎤"}
                </span>
              }
            />
          ) : (
            <span className="ahero__avatar-initials" aria-hidden="true">
              {initials || "🎤"}
            </span>
          )}
          {busy && (
            <div className="ahero__avatar-loading" aria-live="polite">
              <span>◌</span>
            </div>
          )}
          <span className="ahero__avatar-edit" aria-hidden="true">Modifier</span>
        </button>
      </div>

      <div className="ahero__avatar-actions">
        {localPhotoPath && (
          <button
            className="ahero__btn ahero__btn--danger"
            onClick={() => void handleRemove()}
            disabled={busy}
            aria-label="Supprimer la photo de profil"
          >
            🗑
          </button>
        )}
      </div>

      {error && (
        <p className="ahero__photo-error" role="alert">{error}</p>
      )}
      {success && !error && (
        <p className="ahero__photo-success" role="status">{success}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void handleInputChange(e)}
      />
    </>
  );
}
