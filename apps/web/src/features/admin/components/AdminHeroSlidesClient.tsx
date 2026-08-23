"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface HeroSlide {
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

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  cover_url: "",
  track_id: "",
  display_order: 0,
  is_active: true,
  starts_at: "",
  ends_at: "",
};

type FormState = typeof EMPTY_FORM;

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function toIso(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

export function AdminHeroSlidesClient() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // hero_slides not yet in generated DB types — cast after migration
  const supabase = getSupabaseBrowserClient() as unknown as SupabaseClient;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true });
    if (e) setError(e.message);
    else setSlides((data as HeroSlide[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, display_order: slides.length });
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setForm({
      title: slide.title,
      subtitle: slide.subtitle ?? "",
      cover_url: slide.cover_url ?? "",
      track_id: slide.track_id ?? "",
      display_order: slide.display_order,
      is_active: slide.is_active,
      starts_at: toDatetimeLocal(slide.starts_at),
      ends_at: toDatetimeLocal(slide.ends_at),
    });
    setEditing(slide);
    setCreating(false);
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      cover_url: form.cover_url.trim() || null,
      track_id: form.track_id.trim() || null,
      display_order: Number(form.display_order),
      is_active: form.is_active,
      starts_at: toIso(form.starts_at),
      ends_at: toIso(form.ends_at),
    };

    let err: { message: string } | null = null;

    if (editing) {
      const res = await supabase
        .from("hero_slides")
        .update(payload)
        .eq("id", editing.id);
      err = res.error;
    } else {
      const res = await supabase.from("hero_slides").insert(payload);
      err = res.error;
    }

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      closeForm();
      void load();
    }
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    await supabase
      .from("hero_slides")
      .update({ is_active: !slide.is_active })
      .eq("id", slide.id);
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette bannière ?")) return;
    setDeleting(id);
    await supabase.from("hero_slides").delete().eq("id", id);
    setDeleting(null);
    void load();
  };

  const handleMoveUp = async (slide: HeroSlide, idx: number) => {
    if (idx === 0) return;
    const prev = slides[idx - 1]!;
    await Promise.all([
      supabase.from("hero_slides").update({ display_order: prev.display_order }).eq("id", slide.id),
      supabase.from("hero_slides").update({ display_order: slide.display_order }).eq("id", prev.id),
    ]);
    void load();
  };

  const handleMoveDown = async (slide: HeroSlide, idx: number) => {
    if (idx === slides.length - 1) return;
    const next = slides[idx + 1]!;
    await Promise.all([
      supabase.from("hero_slides").update({ display_order: next.display_order }).eq("id", slide.id),
      supabase.from("hero_slides").update({ display_order: slide.display_order }).eq("id", next.id),
    ]);
    void load();
  };

  const field = (key: keyof FormState, value: string | boolean | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="admin-hero-slides">
      <div className="ahs-toolbar">
        <p className="ahs-count">
          {loading ? "Chargement…" : `${slides.length} bannière${slides.length !== 1 ? "s" : ""}`}
        </p>
        <button className="admin-btn admin-btn-primary" onClick={openCreate} disabled={creating || !!editing}>
          + Nouvelle bannière
        </button>
      </div>

      {error && !creating && !editing && (
        <p className="ahs-error" role="alert">{error}</p>
      )}

      {/* Form */}
      {(creating || editing) && (
        <div className="ahs-form-wrap">
          <h3 className="ahs-form-title">
            {editing ? "Modifier la bannière" : "Nouvelle bannière"}
          </h3>

          <div className="ahs-form-grid">
            <label className="ahs-label">
              Titre <span aria-hidden="true">*</span>
              <input
                className="ahs-input"
                value={form.title}
                onChange={(e) => field("title", e.target.value)}
                placeholder="Bienvenue sur SONAFRIK"
                maxLength={100}
              />
            </label>

            <label className="ahs-label">
              Sous-titre
              <input
                className="ahs-input"
                value={form.subtitle}
                onChange={(e) => field("subtitle", e.target.value)}
                placeholder="La musique africaine en streaming"
                maxLength={200}
              />
            </label>

            <label className="ahs-label">
              URL de la photo de couverture
              <input
                className="ahs-input"
                value={form.cover_url}
                onChange={(e) => field("cover_url", e.target.value)}
                placeholder="https://…"
              />
            </label>

            <label className="ahs-label">
              ID du morceau lié (optionnel)
              <input
                className="ahs-input"
                value={form.track_id}
                onChange={(e) => field("track_id", e.target.value)}
                placeholder="uuid du track"
              />
            </label>

            <label className="ahs-label ahs-label--sm">
              Ordre d&apos;affichage
              <input
                className="ahs-input ahs-input--sm"
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => field("display_order", Number(e.target.value))}
              />
            </label>

            <label className="ahs-label ahs-label--sm">
              Diffusion depuis
              <input
                className="ahs-input"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => field("starts_at", e.target.value)}
              />
            </label>

            <label className="ahs-label ahs-label--sm">
              Diffusion jusqu&apos;à
              <input
                className="ahs-input"
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => field("ends_at", e.target.value)}
              />
            </label>

            <label className="ahs-label ahs-label--checkbox">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => field("is_active", e.target.checked)}
              />
              Active
            </label>
          </div>

          {error && <p className="ahs-error" role="alert">{error}</p>}

          <div className="ahs-form-actions">
            <button
              className="admin-btn admin-btn-ghost"
              onClick={closeForm}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && slides.length === 0 && !creating && (
        <div className="admin-td-empty">Aucune bannière. Créez-en une.</div>
      )}

      {slides.length > 0 && (
        <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th">Ordre</th>
                <th className="admin-th">Titre</th>
                <th className="admin-th">Statut</th>
                <th className="admin-th">Programmation</th>
                <th className="admin-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slides.map((slide, idx) => (
                <tr key={slide.id} className="admin-tr">
                  <td className="admin-td">
                    <div className="ahs-order-btns">
                      <button
                        className="ahs-order-btn"
                        onClick={() => void handleMoveUp(slide, idx)}
                        disabled={idx === 0}
                        aria-label="Monter"
                      >▲</button>
                      <span>{slide.display_order}</span>
                      <button
                        className="ahs-order-btn"
                        onClick={() => void handleMoveDown(slide, idx)}
                        disabled={idx === slides.length - 1}
                        aria-label="Descendre"
                      >▼</button>
                    </div>
                  </td>
                  <td className="admin-td">
                    <div className="ahs-slide-title">{slide.title}</div>
                    {slide.subtitle && (
                      <div className="ahs-slide-sub">{slide.subtitle}</div>
                    )}
                  </td>
                  <td className="admin-td">
                    <button
                      className={`admin-status-badge ${slide.is_active ? "badge-active" : "badge-default"}`}
                      onClick={() => void handleToggleActive(slide)}
                      title="Cliquer pour basculer"
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      {slide.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="admin-td ahs-schedule">
                    {slide.starts_at
                      ? new Date(slide.starts_at).toLocaleDateString("fr-GN")
                      : "—"}{" "}
                    →{" "}
                    {slide.ends_at
                      ? new Date(slide.ends_at).toLocaleDateString("fr-GN")
                      : "∞"}
                  </td>
                  <td className="admin-td">
                    <div className="ahs-row-actions">
                      <button
                        className="admin-btn admin-btn-ghost ahs-btn-sm"
                        onClick={() => openEdit(slide)}
                      >
                        Modifier
                      </button>
                      <button
                        className="admin-btn admin-btn-danger ahs-btn-sm"
                        onClick={() => void handleDelete(slide.id)}
                        disabled={deleting === slide.id}
                      >
                        {deleting === slide.id ? "…" : "Supprimer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
