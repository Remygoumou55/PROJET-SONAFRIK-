import dynamic from "next/dynamic";
import { ListenHeroGreeting } from "./ListenHeroGreeting";

// Lazy-loaded client component — carousel auto-fetches trending artists, no SSR needed
const HeroCarousel = dynamic(
  () => import("./HeroCarousel").then((m) => m.HeroCarousel),
  { ssr: false },
);

interface HomepageHeroProps {
  fullName: string | null;
}

export function HomepageHero({ fullName }: HomepageHeroProps) {
  return (
    <div className="listen-hero-compact px-6">
      <ListenHeroGreeting fullName={fullName} />
      <HeroCarousel />
    </div>
  );
}
