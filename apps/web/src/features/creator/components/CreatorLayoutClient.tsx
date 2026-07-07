"use client";

import { usePathname } from "next/navigation";
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

  return (
    <>
      <CreatorMobileNav activePath={pathname} navEntries={navEntries} />
      <div className="enterprise-content-card creator-workspace__main">
        <div className="enterprise-content-card__inner creator-workspace__frame">{children}</div>
      </div>
    </>
  );
}
