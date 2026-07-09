"use client";

import { useCallback, useEffect, useState } from "react";
import { invalidateCreatorAssetUrl } from "@/lib/image/creator-asset-url-cache";
import { useCreatorService } from "../../hooks/useCreator";
import {
  assertBrowserSessionForUpload,
  resolveCreatorIdForUpload,
  useEffectiveCreatorId,
} from "../../hooks/useEffectiveCreatorId";
import { publishArtistProfileUpdate } from "@/features/creator/identity/lib/publishArtistProfileUpdate";
import { uploadAssetToSignedUrl } from "@/lib/upload/uploadAsset";
import { useSuccessToast } from "@/features/shared/feedback/useSuccessToast";
import { useUploadErrorToast } from "@/features/shared/feedback/useErrorToast";
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
  const showSuccessToast = useSuccessToast();
  const showUploadError = useUploadErrorToast();
  const [localPhotoPath, setLocalPhotoPath] = useState(photoPath);

  useEffect(() => {
    setLocalPhotoPath(photoPath);
  }, [photoPath]);

  const initials = stageName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const uploadAvatar = useCallback(async (prepared: AutoImagePrepared) => {
    await assertBrowserSessionForUpload();
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
  }, [creatorIdProp, creatorService]);

  const {
    inputRef,
    uploading,
    accept,
    openFilePicker,
    handleInputChange,
  } = useAutoImageUpload({
    variant: AUTO_IMAGE_VARIANTS.avatar,
    onUpload: uploadAvatar,
    onSuccess: () => showSuccessToast("Avatar enregistré"),
    onError: (message) => showUploadError(new Error(message), "Échec de l'enregistrement de l'avatar."),
    successMessage: null,
  });

  const busy = uploading;

  return (
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
              fit="contain"
              layout="bounded"
              className="ahero__avatar-img"
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
          {busy ? (
            <div className="ahero__avatar-loading" aria-live="polite">
              <span>◌</span>
            </div>
          ) : null}
          <span className="ahero__avatar-edit" aria-hidden="true">Modifier</span>
        </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void handleInputChange(e)}
      />
    </div>
  );
}
