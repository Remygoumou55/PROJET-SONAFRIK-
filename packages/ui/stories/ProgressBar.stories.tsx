import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "../src/components/ProgressBar";

const meta: Meta<typeof ProgressBar> = {
  title: "SONAFRIK/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "**REAL LISTEN V7.2** — Barre NON CLIQUABLE. `pointer-events-none`, `cursor-default`, `tabIndex={-1}`. Aucune interaction utilisateur.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: { value: 65, showLabel: true, className: "w-80" },
};

export const Premium: Story = {
  args: { value: 92, variant: "premium", showLabel: true, className: "w-80" },
};

export const Complete: Story = {
  args: { value: 100, label: "Écoute valide (≥90%)", showLabel: true, className: "w-80" },
};
