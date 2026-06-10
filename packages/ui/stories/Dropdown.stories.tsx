import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../src/components/Button";
import { Dropdown } from "../src/components/Dropdown";

const meta: Meta<typeof Dropdown> = {
  title: "SONAFRIK/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  render: () => (
    <Dropdown
      trigger={<Button variant="secondary">Options</Button>}
      items={[
        { label: "Ajouter à la playlist" },
        { label: "Partager" },
        { label: "Signaler", destructive: true },
      ]}
    />
  ),
};
