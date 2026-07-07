"use client";

import { useCallback } from "react";
import { useToast } from "@sonafrik/ui";

/** Toast succès éphémère — remplace les messages techniques inline dans le Hero. */
export function useSuccessToast() {
  const { toast } = useToast();

  return useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "success",
        duration: 3200,
      });
    },
    [toast],
  );
}
