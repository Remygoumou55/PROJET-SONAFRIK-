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
      label: "Mes favoris",
      count: favoritesCount,
    },
    {
      href: "/library",
      icon: "📥",
      label: "Téléchargements",
      count: downloadsCount,
    },
  ];

  return (
    <div className="sidebar-playlists">
      <p className="sidebar-section-label">Mes playlists</p>
      {playlists.map((playlist) => (
        <Link key={playlist.href} href={playlist.href} className="sidebar-playlist-item">
          <span className="sidebar-playlist-icon" aria-hidden="true">
            {playlist.icon}
          </span>
          <span className="sidebar-playlist-label">{playlist.label}</span>
          {playlist.count > 0 ? (
            <span className="sidebar-playlist-count">{playlist.count}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
