import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../src/components/Badge";

const meta: Meta<typeof Badge> = {
  title: "SONAFRIK/Badge",
  component: Badge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: "Standard" } };
export const Verified: Story = { args: { children: "Vérifié", variant: "verified" } };
export const Premium: Story = { args: { children: "Premium", variant: "premium" } };
export const Founder: Story = { args: { children: "Fondateur SONAFRIK", variant: "founder" } };
