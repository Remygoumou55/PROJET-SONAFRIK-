import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Écouter — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

export default function ListenPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#FFFFFF" }}>
        Bonne écoute
      </h1>
      <p className="text-sm" style={{ color: "#A0A0A0" }}>
        Recherchez un morceau ou explorez votre bibliothèque pour commencer à écouter.
      </p>
    </div>
  );
}
