import type { Meta, StoryObj } from "@storybook/react";
import { PlayerControls } from "../src/components/PlayerControls";

const meta: Meta<typeof PlayerControls> = {
  title: "SONAFRIK/PlayerControls",
  component: PlayerControls,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Contrôles du lecteur avec barre REAL LISTEN non cliquable. Pas de bouton vitesse (x1.5, x2).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlayerControls>;

export const Playing: Story = {
  args: {
    title: "Notre Bien Commun",
    artist: "Takana Zion",
    isPlaying: true,
    progress: 72,
    currentTime: "2:41",
    totalTime: "3:42",
    onPlayPause: () => undefined,
    onPrevious: () => undefined,
    onNext: () => undefined,
    className: "w-full max-w-3xl",
  },
};

export const Paused: Story = {
  args: {
    title: "Afro Vibes 2026",
    artist: "Artiste Émergent",
    isPlaying: false,
    progress: 35,
    currentTime: "1:12",
    totalTime: "3:20",
    onPlayPause: () => undefined,
    className: "w-full max-w-3xl",
  },
};
