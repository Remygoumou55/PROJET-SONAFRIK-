import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../src/components/Input";

const meta: Meta<typeof Input> = {
  title: "SONAFRIK/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { label: "Nom d'utilisateur", placeholder: "Entrez votre nom" },
};
export const WithError: Story = {
  args: { label: "Email", error: "Adresse email invalide", defaultValue: "test@" },
};
export const WithHint: Story = {
  args: { label: "Téléphone", hint: "Format : +224 XXX XX XX XX" },
};
