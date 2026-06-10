import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../src/components/Card";

const meta: Meta<typeof Card> = {
  title: "SONAFRIK/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>NOTRE BIEN COMMUN</CardTitle>
        <CardDescription>Music Operating System Africain</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-texte-secondaire">Contenu de la carte</p>
      </CardContent>
    </Card>
  ),
};

export const Premium: Story = {
  render: () => (
    <Card variant="premium" className="w-80">
      <CardHeader>
        <CardTitle>Abonnement Premium</CardTitle>
        <CardDescription>80 000 GNF / mois</CardDescription>
      </CardHeader>
    </Card>
  ),
};
