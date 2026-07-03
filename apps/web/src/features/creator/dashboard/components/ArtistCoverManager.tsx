"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { Modal } from "@sonafrik/ui";
import { IMAGE_ACCEPT, IMAGE_POLICY, type ImageMime } from "@sonafrik/shared";
import {
  compressImageFile,
  createImagePreviewUrl,
  IMAGE_UPLOAD,
  isAllowedImageMime,
  revokeImagePreviewUrl,
} from "@/lib/image/compress-image";

type AllowedImageMime = ImageMime;
import { invalidateCreatorAssetUrl } from "@/lib/image/creator-asset-url-cache";
import { useCreatorService } from "../../hooks/useCreator";
import { useRouter } from "next/navigation";
import { CreatorAssetImage } from "./CreatorAssetImage";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

type SavedItem  = { id: string; kind: "saved";   path: string };
type PendingItem = { id: string; kind: "pending"; file: File; previewUrl: string };
type CoverItem   = SavedItem | PendingItem;

function pathsToItems(paths: string[]): CoverItem[] {
  return paths.map((path) => ({ id: path, kind: "saved", path }));
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

/* ─── Props ─────────────────────────────────────────────────────────────────── */

export interface ArtistCoverManagerProps {
  creatorId: string;
  stageName: string;
  coverImages: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImagesChange?: () => void;
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const MAX_MB    = IMAGE_POLICY.maxBytes / 1024 / 1024;
const MAX_ITEMS = IMAGE_UPLOAD.MAX_GALLERY_ITEMS;
const ACCEPTED  = IMAGE_ACCEPT;

const TIPS = [
  "Utilisez des images nettes et haute résolution.",
  "Format recommandé : 16:9 (1920 × 1080 px).",
  "Évitez les textes trop petits dans vos visuels.",
  "Les dégradés sombres amplifient l'ambiance artistique.",
];

/* ─── Component ─────────────────────────────────────────────────────────────── */

export function ArtistCoverManager({
  creatorId,
  stageName,
  coverImages,
  open,
  onOpenChange,
  onImagesChange,
}: ArtistCoverManagerProps) {
  const creatorService  = useCreatorService();
  const router          = useRouter();
  const inputRef        = useRef<HTMLInputElement>(null);
  const editInputRef    = useRef<HTMLInputElement>(null);
  const editTargetId    = useRef<string | null>(null);
  const dragSrcIndex    = useRef<number | null>(null);
  const prevOpenRef     = useRef(false);

  const [items,       setItems]       = useState<CoverItem[]>(() => pathsToItems(coverImages));
  const [isDragOver,  setIsDragOver]  = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<string[]>([]);

  /* Reset when modal opens */
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setItems((prev) => {
        prev.forEach((it) => { if (it.kind === "pending") revokeImagePreviewUrl(it.previewUrl); });
        return pathsToItems(coverImages);
      });
      setErrors([]);
    }
    prevOpenRef.current = open;
  }, [open, coverImages]);

  /* Cleanup previews on unmount */
  useEffect(() => {
    return () => {
      setItems((prev) => {
        prev.forEach((it) => { if (it.kind === "pending") revokeImagePreviewUrl(it.previewUrl); });
        return prev;
      });
    };
  }, []);

  /* ─── File processing ──────────────────────────────────────────────────────── */

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const list      = Array.from(files);
    const errs: string[] = [];
    let   addCount  = 0;

    setCompressing(true);
    setErrors([]);

    const incoming: PendingItem[] = [];

    for (const file of list) {
      setItems((prev) => {
        const total = prev.length + incoming.length + addCount;
        if (total >= MAX_ITEMS) {
          if (!errs.includes(`Limite de ${MAX_ITEMS} images atteinte.`)) {
            errs.push(`Limite de ${MAX_ITEMS} images atteinte.`);
          }
          return prev;
        }
        return prev;
      });

      if (!isAllowedImageMime(file.type)) {
        errs.push(`${file.name} : format non supporté (JPG, PNG, WebP).`);
        continue;
      }
      if (file.size > IMAGE_POLICY.maxBytes) {
        errs.push(`${file.name} : trop lourd (max ${MAX_MB} Mo).`);
        continue;
      }

      try {
        const compressed = await compressImageFile(file, {
          maxWidth:  IMAGE_UPLOAD.COVER_MAX_PX,
          maxHeight: Math.round(IMAGE_UPLOAD.COVER_MAX_PX / (16 / 9)),
          crop:      "cover",
        });
        incoming.push({
          id:         uid(),
          kind:       "pending",
          file:       compressed,
          previewUrl: createImagePreviewUrl(compressed),
        });
        addCount++;
      } catch {
        errs.push(`${file.name} : impossible de traiter cette image.`);
      }
    }

    setCompressing(false);

    if (incoming.length > 0) {
      setItems((prev) => {
        const remaining = MAX_ITEMS - prev.length;
        return [...prev, ...incoming.slice(0, remaining)];
      });
    }
    if (errs.length > 0) setErrors(errs);
  }, []);

  /* ─── Drop zone ────────────────────────────────────────────────────────────── */

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) void processFiles(e.dataTransfer.files);
  }
  function onDragOver(e: DragEvent<HTMLDivElement>)  { e.preventDefault(); setIsDragOver(true); }
  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  }

  /* ─── File input handlers ─────────────────────────────────────────────────── */

  function handleAddInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) void processFiles(e.target.files);
    e.target.value = "";
  }

  function handleEditInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file     = e.target.files?.[0];
    const targetId = editTargetId.current;
    e.target.value = "";
    if (!file || !targetId) return;

    if (!isAllowedImageMime(file.type)) { setErrors(["Format non supporté."]); return; }

    void compressImageFile(file, {
      maxWidth:  IMAGE_UPLOAD.COVER_MAX_PX,
      maxHeight: Math.round(IMAGE_UPLOAD.COVER_MAX_PX / (16 / 9)),
      crop:      "cover",
    }).then((compressed) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== targetId) return it;
          if (it.kind === "pending") revokeImagePreviewUrl(it.previewUrl);
          return { id: it.id, kind: "pending" as const, file: compressed, previewUrl: createImagePreviewUrl(compressed) };
        }),
      );
    }).catch(() => setErrors(["Impossible de remplacer cette image."]));
  }

  /* ─── Gallery actions ─────────────────────────────────────────────────────── */

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item?.kind === "pending") revokeImagePreviewUrl(item.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
  }

  function setAsPrimary(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      if (!moved) return prev;
      return [moved, ...next];
    });
  }

  function startEdit(id: string) {
    editTargetId.current = id;
    editInputRef.current?.click();
  }

  /* ─── Drag-to-reorder ────────────────────────────────────────────────────── */

  function onItemDragStart(idx: number) { dragSrcIndex.current = idx; }
  function onItemDragOver(e: DragEvent<HTMLLIElement>) { e.preventDefault(); }

  function onItemDrop(e: DragEvent<HTMLLIElement>, targetIdx: number) {
    e.preventDefault();
    e.currentTarget.classList.remove("cs-card--over");
    const src = dragSrcIndex.current;
    dragSrcIndex.current = null;
    if (src === null || src === targetIdx) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(src, 1);
      if (!moved) return prev;
      next.splice(targetIdx, 0, moved);
      return next;
    });
  }

  /* ─── Save ───────────────────────────────────────────────────────────────── */

  async function handleSave() {
    setSaving(true);
    setErrors([]);
    const finalPaths: string[] = [];

    try {
      for (const item of items) {
        if (item.kind === "saved") {
          finalPaths.push(item.path);
        } else {
          const contentType = item.file.type as AllowedImageMime;
          const { signedUrl, token, path } = await creatorService.requestAssetUploadUrl({
            creatorId,
            assetKind:   "gallery",
            contentType,
          });
          const res = await fetch(signedUrl, {
            method:  "PUT",
            headers: { "Content-Type": contentType, ...(token ? { "x-upsert": "true" } : {}) },
            body:    item.file,
          });
          if (!res.ok) throw new Error(`Échec de l'envoi : ${item.file.name}`);
          revokeImagePreviewUrl(item.previewUrl);
          finalPaths.push(path);
        }
      }

      await creatorService.updateCoverGallery({ creatorId, coverImages: finalPaths });
      invalidateCreatorAssetUrl(creatorId);
      onImagesChange?.();
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Erreur lors de l'enregistrement."]);
    } finally {
      setSaving(false);
    }
  }

  /* ─── Cancel / cleanup ───────────────────────────────────────────────────── */

  function cleanup() {
    setItems((prev) => {
      prev.forEach((it) => { if (it.kind === "pending") revokeImagePreviewUrl(it.previewUrl); });
      return pathsToItems(coverImages);
    });
    setErrors([]);
  }

  /* ─── Derived state ──────────────────────────────────────────────────────── */

  const canAddMore = items.length < MAX_ITEMS;

  /* ─── Render ─────────────────────────────────────────────────────────────── */

  return (
    <>
      <Modal
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) cleanup();
          onOpenChange(nextOpen);
        }}
        title="Studio Couverture"
        description={`Donnez une identité visuelle à votre univers artistique — ${stageName}.`}
        size="full"
        footer={
          <>
            <button
              type="button"
              className="cs-btn cs-btn--cancel"
              disabled={saving}
              onClick={() => { cleanup(); onOpenChange(false); }}
            >
              Annuler
            </button>
            <button
              type="button"
              className="cs-btn cs-btn--save"
              disabled={saving || compressing}
              onClick={() => void handleSave()}
            >
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </>
        }
      >
        <div className="cs-studio">

          {/* ── Error banner ───────────────────────────────────────── */}
          {errors.length > 0 && (
            <div className="cs-errors" role="alert" aria-live="assertive">
              {errors.map((e, i) => <p key={i} className="cs-error">{e}</p>)}
            </div>
          )}

          {/* ── Drop zone (visible only when below max) ─────────────── */}
          {canAddMore && (
            <div
              className={`cs-dropzone${isDragOver ? " cs-dropzone--over" : ""}${compressing ? " cs-dropzone--busy" : ""}`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragEnter={onDragOver}
              onDragLeave={onDragLeave}
              aria-label="Zone de dépôt d'images"
              role="region"
            >
              {compressing ? (
                <div className="cs-dropzone__inner">
                  <span className="cs-dropzone__icon cs-dropzone__icon--spin" aria-hidden="true">◌</span>
                  <p className="cs-dropzone__text">Compression en cours…</p>
                </div>
              ) : (
                <div className="cs-dropzone__inner">
                  <span className="cs-dropzone__icon" aria-hidden="true">
                    {isDragOver ? "✦" : "⊕"}
                  </span>
                  <p className="cs-dropzone__text">Glissez vos images ici</p>
                  <p className="cs-dropzone__or">ou</p>
                  <button
                    type="button"
                    className="cs-dropzone__btn"
                    onClick={() => inputRef.current?.click()}
                  >
                    Ajouter des images
                  </button>
                  <p className="cs-dropzone__hint">
                    JPG · PNG · WebP · max {MAX_MB} Mo par image · {MAX_ITEMS} images max
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Gallery ─────────────────────────────────────────────── */}
          {items.length > 0 && (
            <section className="cs-gallery-section" aria-label="Galerie des couvertures">
              <div className="cs-gallery-header">
                <h3 className="cs-gallery-title">
                  {items.length} image{items.length !== 1 ? "s" : ""}
                </h3>
                <p className="cs-gallery-hint">Faites glisser les cartes pour réorganiser</p>
              </div>

              <ul className="cs-gallery" aria-label="Vos couvertures">
                {items.map((item, index) => {
                  const isPrimary = index === 0;
                  return (
                    <li
                      key={item.id}
                      className={`cs-card${isPrimary ? " cs-card--primary" : ""}`}
                      draggable
                      onDragStart={() => onItemDragStart(index)}
                      onDragOver={onItemDragOver}
                      onDragEnter={(e) => e.currentTarget.classList.add("cs-card--over")}
                      onDragLeave={(e) => e.currentTarget.classList.remove("cs-card--over")}
                      onDrop={(e) => onItemDrop(e, index)}
                    >
                      <div className="cs-card__thumb">
                        {/* Image */}
                        {item.kind === "pending" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.previewUrl}
                            alt={`Aperçu couverture ${index + 1}`}
                            className="cs-card__img"
                            loading="lazy"
                          />
                        ) : (
                          <CreatorAssetImage
                            creatorId={creatorId}
                            path={item.path}
                            assetKind="gallery"
                            alt={`Couverture ${index + 1}`}
                            layout="bounded"
                            className="cs-card__img"
                            sizes="(min-width: 640px) 200px, 140px"
                          />
                        )}

                        {/* Primary badge */}
                        {isPrimary && (
                          <span className="cs-card__crown" aria-label="Couverture principale">
                            ✓ Couverture
                          </span>
                        )}

                        {/* Pending indicator */}
                        {item.kind === "pending" && (
                          <span className="cs-card__pending" aria-label="À enregistrer">Nouveau</span>
                        )}

                        {/* Hover actions */}
                        <div className="cs-card__actions">
                          {!isPrimary && (
                            <button
                              type="button"
                              className="cs-card__btn"
                              onClick={() => setAsPrimary(item.id)}
                              aria-label="Définir comme couverture principale"
                              title="Couverture principale"
                            >
                              ⭐
                            </button>
                          )}
                          <button
                            type="button"
                            className="cs-card__btn"
                            onClick={() => startEdit(item.id)}
                            aria-label="Remplacer cette image"
                            title="Modifier"
                          >
                            ✏
                          </button>
                          <button
                            type="button"
                            className="cs-card__btn cs-card__btn--danger"
                            onClick={() => removeItem(item.id)}
                            aria-label="Supprimer cette image"
                            title="Supprimer"
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      <p className="cs-card__label">
                        {isPrimary ? "Couverture principale" : `Image ${index + 1}`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ── Tips ────────────────────────────────────────────────── */}
          <aside className="cs-tips" aria-label="Conseils Studio Couverture">
            <p className="cs-tips__title">💡 Conseils</p>
            <ul className="cs-tips__list">
              {TIPS.map((tip) => (
                <li key={tip} className="cs-tips__item">
                  <span className="cs-tips__dot" aria-hidden="true">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </aside>

        </div>
      </Modal>

      {/* Hidden inputs */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleAddInput}
      />
      <input
        ref={editInputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleEditInput}
      />
    </>
  );
}
