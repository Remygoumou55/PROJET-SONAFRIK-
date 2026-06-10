import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../src/components/Button";
import { ToastProvider, useToast } from "../src/components/Toast";

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast({ title: "Titre ajouté aux favoris" })}>Default</Button>
      <Button variant="primary" onClick={() => toast({ title: "Publication réussie", variant: "success" })}>
        Success
      </Button>
      <Button variant="premium" onClick={() => toast({ title: "Premium activé", variant: "premium" })}>
        Premium
      </Button>
      <Button variant="destructive" onClick={() => toast({ title: "Erreur de connexion", variant: "error" })}>
        Error
      </Button>
    </div>
  );
}

const meta: Meta = {
  title: "SONAFRIK/Toast",
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => <ToastDemo /> };
