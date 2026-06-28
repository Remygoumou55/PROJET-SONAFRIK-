import Link from "next/link";

interface QuickPlaylistsProps {
  favoritesCount: number;
  downloadsCount: number;
}

export function QuickPlaylists({ favoritesCount, downloadsCount }: QuickPlaylistsProps) {
  const playlists = [
    {
      href: "/library?tab=favoris",
      icon: "❤️",
      label: "Favoris",
      count: favoritesCount,
    },
    {
      href: "/library",
      icon: "📥",
      label: "Téléchargés",
      count: downloadsCount,
    },
  ];

  return (
    <div className="ls-playlists">
      <p className="ls-section-label">Mes playlists</p>
      {playlists.map((playlist) => (
        <Link key={playlist.href} href={playlist.href} className="ls-playlist-item">
          <span className="ls-playlist-icon" aria-hidden="true">
            {playlist.icon}
          </span>
          <span className="ls-playlist-label">{playlist.label}</span>
          {playlist.count > 0 ? (
            <span className="ls-playlist-count">{playlist.count}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
