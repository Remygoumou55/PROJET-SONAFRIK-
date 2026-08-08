/**
 * Admin Hero Slides Repository
 * Gère les opérations de base de données pour les bannières hero
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  track_id: string | null;
  display_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export class AdminHeroRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listSlides(): Promise<HeroSlide[]> {
    const { data, error } = await this.supabase
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw new Error(`Failed to list hero slides: ${error.message}`);
    return (data as HeroSlide[]) ?? [];
  }

  async createSlide(payload: Omit<HeroSlide, "id" | "created_at">): Promise<HeroSlide> {
    const { data, error } = await this.supabase
      .from("hero_slides")
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(`Failed to create hero slide: ${error.message}`);
    return data as HeroSlide;
  }

  async updateSlide(id: string, payload: Partial<HeroSlide>): Promise<HeroSlide> {
    const { data, error } = await this.supabase
      .from("hero_slides")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update hero slide: ${error.message}`);
    return data as HeroSlide;
  }

  async deleteSlide(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("hero_slides")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete hero slide: ${error.message}`);
  }

  async reorderSlides(id1: string, order1: number, id2: string, order2: number): Promise<void> {
    const { error } = await this.supabase.rpc("reorder_hero_slides", {
      p_id1: id1,
      p_order1: order1,
      p_id2: id2,
      p_order2: order2,
    });

    if (error) throw new Error(`Failed to reorder hero slides: ${error.message}`);
  }
}
