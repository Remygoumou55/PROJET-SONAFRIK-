import type { Meta, StoryObj } from "@storybook/react";
import { TrackCard } from "../src/components/TrackCard";

const meta: Meta<typeof TrackCard> = {
  title: "SONAFRIK/TrackCard",
  component: TrackCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TrackCard>;

export const Default: Story = {
  args: {
    title: "Notre Bien Commun",
    artist: "Takana Zion",
    duration: "3:42",
    index: 1,
    className: "w-full max-w-md",
  },
};

export const Playing: Story = {
  args: {
    title: "En lecture",
    artist: "Artiste Guinéen",
    duration: "4:15",
    isPlaying: true,
    className: "w-full max-w-md",
  },
};
