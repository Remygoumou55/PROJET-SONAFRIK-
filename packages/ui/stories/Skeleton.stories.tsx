import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonText } from "../src/components/Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "SONAFRIK/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = { render: () => <SkeletonText lines={3} className="w-64" /> };
export const Card: Story = { args: { variant: "card", className: "w-48" } };
export const Circular: Story = { args: { variant: "circular", width: 64, height: 64 } };
