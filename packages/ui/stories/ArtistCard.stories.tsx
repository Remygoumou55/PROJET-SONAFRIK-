import type { Meta, StoryObj } from "@storybook/react";
import { ArtistCard } from "../src/components/ArtistCard";

const meta: Meta<typeof ArtistCard> = {
  title: "SONAFRIK/ArtistCard",
  component: ArtistCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ArtistCard>;

export const Default: Story = {
  args: {
    name: "Takana Zion",
    genre: "Reggae · Guinée",
    listeners: "48 290",
    tier: "verifie",
    verified: true,
    className: "w-48",
  },
};

export const Founder: Story = {
  args: {
    name: "Artiste Fondateur",
    genre: "Afrobeat",
    tier: "fondateur",
    className: "w-48",
  },
};
