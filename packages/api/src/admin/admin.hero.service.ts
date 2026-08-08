/**
 * Admin Hero Slides Service
 * Couche de service pour la logique métier des bannières hero
 */

import { AdminHeroRepository, type HeroSlide } from "./admin.hero.repository";

export class AdminHeroService {
  constructor(private readonly repository: AdminHeroRepository) {}

  async listSlides(): Promise<HeroSlide[]> {
    return this.repository.listSlides();
  }

  async createSlide(payload: Omit<HeroSlide, "id" | "created_at">): Promise<HeroSlide> {
    return this.repository.createSlide(payload);
  }

  async updateSlide(id: string, payload: Partial<HeroSlide>): Promise<HeroSlide> {
    return this.repository.updateSlide(id, payload);
  }

  async deleteSlide(id: string): Promise<void> {
    return this.repository.deleteSlide(id);
  }

  async toggleActive(id: string, isActive: boolean): Promise<HeroSlide> {
    return this.repository.updateSlide(id, { is_active: isActive });
  }

  async moveUp(slide: HeroSlide, currentIndex: number, allSlides: HeroSlide[]): Promise<void> {
    if (currentIndex === 0) return;
    const prev = allSlides[currentIndex - 1];
    if (!prev) return;
    await this.repository.reorderSlides(slide.id, prev.display_order, prev.id, slide.display_order);
  }

  async moveDown(slide: HeroSlide, currentIndex: number, allSlides: HeroSlide[]): Promise<void> {
    if (currentIndex === allSlides.length - 1) return;
    const next = allSlides[currentIndex + 1];
    if (!next) return;
    await this.repository.reorderSlides(slide.id, next.display_order, next.id, slide.display_order);
  }
}
