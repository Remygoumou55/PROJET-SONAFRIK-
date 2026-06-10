import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "../src/components/SearchInput";

const meta: Meta<typeof SearchInput> = {
  title: "SONAFRIK/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {
  args: { placeholder: "Rechercher un artiste, un titre…" },
};
