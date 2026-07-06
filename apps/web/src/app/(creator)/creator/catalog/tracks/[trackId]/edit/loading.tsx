export default function EditTrackLoading() {
  return (
    <div className="creator-page" aria-busy="true" aria-label="Chargement de l'éditeur de morceau">
      <div className="pub-skeleton" style={{ height: "2rem", width: "12rem", marginBottom: "1.5rem" }} />
      <div className="pub-skeleton pub-skeleton--card" style={{ minHeight: "22rem", marginBottom: "1rem" }} />
      <div className="pub-skeleton pub-skeleton--card" style={{ minHeight: "10rem", animationDelay: "80ms" }} />
    </div>
  );
}
