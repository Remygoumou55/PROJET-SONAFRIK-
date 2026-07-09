"use client";

import { usePathname } from "next/navigation";
import { ToastProvider } from "@sonafrik/ui";
import { CreatorMobileNav } from "./CreatorMobileNav";
import type { CreatorNavEntry } from "../lib/creatorNavConfig";

export function CreatorLayoutClient({
  navEntries,
  children,
}: {
  navEntries: CreatorNavEntry[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicationsRoute = pathname === "/creator/catalog/tracks";

  const content = (
    <>
      <CreatorMobileNav
        activePath={pathname}
        navEntries={navEntries}
        prefetchEnabled={!isPublicationsRoute}
      />
      <div className="enterprise-content-card creator-workspace__main">
        <div className="enterprise-content-card__inner creator-workspace__frame">{children}</div>
      </div>
    </>
  );

  if (isPublicationsRoute) {
    return content;
  }

  return (
    <ToastProvider>
      {content}
    </ToastProvider>
  );
}
