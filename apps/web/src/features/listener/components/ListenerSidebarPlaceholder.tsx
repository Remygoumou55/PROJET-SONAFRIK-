/** Placeholder desktop sidebar — évite layout shift avant hydratation chrome. */
export function ListenerSidebarPlaceholder() {
  return <aside className="listener-sidebar hidden md:flex" aria-hidden="true" />;
}
