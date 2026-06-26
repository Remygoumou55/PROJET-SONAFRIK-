"use client";

import { useEffect, useState } from "react";
import { useCreatorService } from "../../hooks/useCreator";
import type { CreatorAssetKind } from "@sonafrik/types";
import {
  getCachedCreatorAssetUrl,
  setCachedCreatorAssetUrl,
} from "@/lib/image/creator-asset-url-cache";

export function useCreatorAssetUrl(
  creatorId: string,
  path: string | null | undefined,
  assetKind: CreatorAssetKind,
): { url: string | null; loading: boolean; error: boolean } {
  const creatorService = useCreatorService();
  const [url, setUrl] = useState<string | null>(() =>
    path ? getCachedCreatorAssetUrl(creatorId, path) : null,
  );
  const [loading, setLoading] = useState(Boolean(path && !url));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      setLoading(false);
      setError(false);
      return;
    }

    const cached = getCachedCreatorAssetUrl(creatorId, path);
    if (cached) {
      setUrl(cached);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    void creatorService.getAssetSignedUrl(creatorId, assetKind, path).then((signed: string | null) => {
      if (cancelled) return;
      if (signed) {
        setCachedCreatorAssetUrl(creatorId, path, signed);
        setUrl(signed);
        setError(false);
      } else {
        setUrl(null);
        setError(true);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [creatorId, path, assetKind, creatorService]);

  return { url, loading, error };
}
