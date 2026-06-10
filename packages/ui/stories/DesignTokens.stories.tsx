import type { Meta, StoryObj } from "@storybook/react";
import { tokens } from "../src/tokens";

const meta: Meta = {
  title: "SONAFRIK/Design Tokens",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Colors: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Object.entries(tokens.colors).map(([name, hex]) => (
        <div key={name} className="flex flex-col gap-1">
          <div className="h-12 rounded-lg border border-bordure" style={{ backgroundColor: hex }} />
          <span className="text-xs text-texte-secondaire">{name}</span>
          <span className="text-xs font-mono text-texte-desactive">{hex}</span>
        </div>
      ))}
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-4xl font-extrabold">Display — NOTRE BIEN COMMUN</p>
      <p className="text-3xl font-bold">H1 — SONAFRIK</p>
      <p className="text-2xl font-semibold">H2 — Section</p>
      <p className="text-base">Body — Écoute · Participe · Prospère</p>
      <p className="text-sm text-texte-secondaire">Caption — Métadonnées</p>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {Object.entries(tokens.spacing).map(([name, px]) => (
        <div key={name} className="flex items-center gap-3">
          <div className="h-4 bg-vert-energie" style={{ width: px }} />
          <span className="text-sm text-texte-secondaire">
            {name}: {px}px
          </span>
        </div>
      ))}
    </div>
  ),
};
