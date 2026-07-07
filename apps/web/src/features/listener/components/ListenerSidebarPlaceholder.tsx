/** Placeholder desktop sidebar — évite layout shift avant hydratation chrome. */
export function ListenerSidebarPlaceholder() {
  return (
    <aside className="music-sidebar music-sidebar--listener" aria-hidden="true">
      <div className="music-sidebar__pattern" />
      <div className="music-sidebar__body" />
    </aside>
  );
}
