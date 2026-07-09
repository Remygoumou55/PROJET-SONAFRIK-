"use client";

import { memo, useCallback, useState } from "react";
import { CreatorAssetImage } from "./CreatorAssetImage";
import { useCreatorService } from "../../hooks/useCreator";
import {
  assertBrowserSessionForUpload,
  resolveCreatorIdForUpload,
  useEffectiveCreatorId,
} from "../../hooks/useEffectiveCreatorId";
import { invalidateCreatorAssetUrl } from "@/lib/image/creator-asset-url-cache";
import { publishArtistProfileUpdate } from "@/features/creator/identity/lib/publishArtistProfileUpdate";
import { uploadAssetToSignedUrl } from "@/lib/upload/uploadAsset";
import { useSuccessToast } from "@/features/shared/feedback/useSuccessToast";
import { useUploadErrorToast } from "@/features/shared/feedback/useErrorToast";
import {
  AUTO_IMAGE_VARIANTS,
  type AutoImagePrepared,
} from "@/features/shared/media/autoImagePipeline";
import { useAutoImageUpload } from "@/features/shared/media/useAutoImageUpload";

interface ArtistCoverSliderProps {
  creatorId: string;
  stageName: string;
  primaryCoverPath: string | null;
}

export const ArtistCoverSlider = memo(function ArtistCoverSlider({
  creatorId: creatorIdProp,
  stageName,
  primaryCoverPath,
}: ArtistCoverSliderProps) {
  const { creatorId: displayCreatorId, resolving } = useEffectiveCreatorId(creatorIdProp);
  const creatorService = useCreatorService();
  const showSuccessToast = useSuccessToast();
  const showUploadError = useUploadErrorToast();
  const [localCoverPath, setLocalCoverPath] = useState(primaryCoverPath);

  const uploadCover = useCallback(async (prepared: AutoImagePrepared) => {
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

    await creatorService.saveCoverPrimaryCrop({
      creatorId,
      croppedPath: path,
      originalPath: path,
      cropX: 0,
      cropY: 0,
      cropZoom: 1,
    });

    invalidateCreatorAssetUrl(creatorId);
    setLocalCoverPath(path);
    publishArtistProfileUpdate(creatorId);
  }, [creatorIdProp, creatorService]);

  const {
    inputRef,
    uploading,
    accept,
    openFilePicker,
    handleInputChange,
  } = useAutoImageUpload({
    variant: AUTO_IMAGE_VARIANTS.hero,
    onUpload: uploadCover,
    onSuccess: () => showSuccessToast("Couverture enregistrée"),
    onError: (message) =>
      showUploadError(new Error(message), "Échec de l'enregistrement de la couverture."),
    successMessage: null,
  });

  return (
    <>
      <div className="ahero__cover">
        {localCoverPath ? (
          <CreatorAssetImage
            creatorId={displayCreatorId}
            path={localCoverPath}
            assetKind="gallery"
            alt={`Couverture ${stageName}`}
            fit="cover"
            layout="fill"
            className="ahero__cover-img"
            sizes="100vw"
            priority
            fallback={<div className="ahero__cover-default" aria-hidden="true" />}
          />
        ) : (
          <div className="ahero__cover-default" aria-hidden="true" />
        )}

        <div className="ahero__overlay" aria-hidden="true" />

        {uploading && (
          <div className="ahero__cover-loading" aria-live="polite">
            <span className="ahero__cover-spin">◌</span>
            <span className="ahero__cover-loading-hint">Enregistrement…</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="ahero__btn ahero__btn--cover"
        onClick={openFilePicker}
        disabled={uploading || resolving}
        aria-label="Changer la photo de couverture"
      >
        <span aria-hidden="true">🖼</span>
        {localCoverPath ? "Changer la couverture" : "Ajouter une couverture"}
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
    </>
  );
});
