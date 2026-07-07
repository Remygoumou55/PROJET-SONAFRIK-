"use client";

import { useCallback, useRef, useState } from "react";
import { IMAGE_ACCEPT } from "@sonafrik/shared";
import {
  prepareAutoImage,
  type AutoImagePrepared,
  type AutoImageVariant,
} from "./autoImagePipeline";

type UseAutoImageUploadOptions = {
  variant: AutoImageVariant;
  onUpload: (prepared: AutoImagePrepared) => Promise<void>;
  onSuccess?: () => void;
  successMessage?: string | null;
};

export function useAutoImageUpload({
  variant,
  onUpload,
  onSuccess,
  successMessage = null,
}: UseAutoImageUploadOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    clearMessages();
    setUploading(true);
    try {
      const prepared = await prepareAutoImage(file, variant);
      await onUpload(prepared);
      if (successMessage) setSuccess(successMessage);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setUploading(false);
    }
  }, [clearMessages, onSuccess, onUpload, successMessage, variant]);

  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadFile(file);
  }, [uploadFile]);

  return {
    inputRef,
    uploading,
    error,
    success,
    accept: IMAGE_ACCEPT,
    openFilePicker,
    handleInputChange,
    clearMessages,
  };
}
