"use client";

import Link from "next/link";
import type { Work } from "@sonafrik/types";

interface Props {
  works: Work[];
  onCreateClick: () => void;
}

export function WorksList({ works, onCreateClick }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#FFFFFF" }}>
            Œuvres musicales
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#555555" }}>
            {works.length} œuvre{works.length !== 1 ? "s" : ""} enregistrée{works.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onCreateClick}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#00D26A", color: "#000000" }}
        >
          + Nouvelle œuvre
        </button>
      </div>

      {works.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{ backgroundColor: "#1F1F1F", border: "1px solid #2A2A2A" }}
        >
          <p className="text-3xl mb-3">🎼</p>
          <p className="text-sm font-semibold mb-1" style={{ color: "#FFFFFF" }}>
            Aucune œuvre enregistrée
          </p>
          <p className="text-xs" style={{ color: "#555555" }}>
            Enregistrez vos œuvres pour gérer vos droits d&apos;auteur et contrats.
          </p>
          <button
            onClick={onCreateClick}
            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#00D26A", color: "#000000" }}
          >
            Créer ma première œuvre
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {works.map((work) => (
            <Link
              key={work.id}
              href={`/creator/rights/${work.id}`}
              className="flex items-center justify-between rounded-xl px-4 py-4 transition-colors group"
              style={{ backgroundColor: "#1F1F1F", border: "1px solid #2A2A2A" }}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#FFFFFF" }}>
                  {work.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {work.iswc && (
                    <span className="text-xs font-mono" style={{ color: "#555555" }}>
                      ISWC {work.iswc}
                    </span>
                  )}
                  {work.genre && (
                    <span className="text-xs" style={{ color: "#A0A0A0" }}>
                      {work.genre}
                    </span>
                  )}
                  <span className="text-xs uppercase" style={{ color: "#555555" }}>
                    {work.language}
                  </span>
                </div>
              </div>
              <span className="text-xs ml-4 shrink-0" style={{ color: "#555555" }}>
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
