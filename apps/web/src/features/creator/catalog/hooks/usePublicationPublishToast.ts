"use client";

import { useCallback } from "react";
import { useToast } from "@sonafrik/ui";

const PUBLICATIONS_HREF = "/creator/catalog/tracks";

/** Toast premium après envoi en revue — 5 s + lien catalogue. */
export function usePublicationPublishToast() {
  const { toast } = useToast();

  return useCallback(() => {
    toast({
      variant: "premium",
      duration: 5000,
      title: "Publication envoyée",
      description:
        "Votre musique a été envoyée avec succès pour validation. Elle est maintenant en cours d'examen par l'équipe SONAFRIK. Vous recevrez une notification dès qu'elle sera approuvée ou si des modifications sont demandées.",
      action: {
        label: "Voir mes publications",
        href: PUBLICATIONS_HREF,
      },
    });
  }, [toast]);
}

export { PUBLICATIONS_HREF };
