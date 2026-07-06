"use client";

import dynamic from "next/dynamic";

const SmartSearchBar = dynamic(
  () => import("./SmartSearchBar").then((m) => ({ default: m.SmartSearchBar })),
  {
    loading: () => <div className="header-filters-skeleton" aria-hidden="true" />,
    ssr: false,
  },
);

export function ListenSearchBarSlot() {
  return <SmartSearchBar />;
}
