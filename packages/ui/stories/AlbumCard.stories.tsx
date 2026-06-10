import type { Meta, StoryObj } from "@storybook/react";
import { AlbumCard } from "../src/components/AlbumCard";

const meta: Meta<typeof AlbumCard> = {
  title: "SONAFRIK/AlbumCard",
  component: AlbumCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AlbumCard>;

export const Default: Story = {
  args: {
    title: "Afro Vibes 2026",
    artist: "Takana Zion",
    year: 2026,
    trackCount: 12,
    className: "w-56",
  },
};

export const PremiumExclusive: Story = {
  args: {
    title: "Exclusivité Premium",
    artist: "Artiste Émergent",
    isPremiumExclusive: true,
    className: "w-56",
  },
};
