"use client";

import { useCallback } from "react";
import { useToast } from "@sonafrik/ui";
import { toUserFacingUploadError } from "./userFacingError";

/** Toast erreur éphémère — remplace les messages rouges inline. */
export function useErrorToast() {
  const { toast } = useToast();

  return useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "error",
        duration: 4500,
      });
    },
    [toast],
  );
}

/** Toast erreur upload avec message utilisateur nettoyé. */
export function useUploadErrorToast() {
  const showError = useErrorToast();

  return useCallback(
    (err: unknown, fallback: string) => {
      showError(toUserFacingUploadError(err, fallback));
    },
    [showError],
  );
}
