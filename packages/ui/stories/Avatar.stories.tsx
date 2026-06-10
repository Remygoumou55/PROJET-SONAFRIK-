import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "../src/components/Avatar";

const meta: Meta<typeof Avatar> = {
  title: "SONAFRIK/Avatar",
  component: Avatar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithInitials: Story = {
  args: { alt: "Takana Zion", size: "lg" },
};

export const WithImage: Story = {
  args: {
    alt: "Artiste SONAFRIK",
    size: "xl",
    src: "https://picsum.photos/200",
  },
};
