import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "../src/components/Tabs";

const meta: Meta<typeof Tabs> = {
  title: "SONAFRIK/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  args: {
    items: [
      { value: "accueil", label: "Accueil", content: <p className="text-texte-secondaire">Contenu Accueil</p> },
      { value: "explorer", label: "Explorer", content: <p className="text-texte-secondaire">Contenu Explorer</p> },
      { value: "bibliotheque", label: "Bibliothèque", content: <p className="text-texte-secondaire">Contenu Bibliothèque</p> },
      { value: "profil", label: "Profil", content: <p className="text-texte-secondaire">Contenu Profil</p> },
    ],
    className: "w-full max-w-lg",
  },
};
