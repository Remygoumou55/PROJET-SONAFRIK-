import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../src/components/Button";

const meta: Meta<typeof Button> = {
  title: "SONAFRIK/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "premium", "destructive"],
    },
    size: { control: "select", options: ["sm", "md", "lg", "icon"] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: "Écouter", variant: "primary" } };
export const Premium: Story = { args: { children: "S'abonner Premium", variant: "premium" } };
export const Loading: Story = { args: { children: "Chargement", isLoading: true } };
export const FullWidth: Story = { args: { children: "Publier ma musique", fullWidth: true } };
