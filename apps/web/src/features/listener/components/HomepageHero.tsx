import { HeroCarousel } from "./HeroCarousel";
import { ListenHeroGreeting } from "./ListenHeroGreeting";

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
