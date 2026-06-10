import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../src/components/Button";
import { Modal } from "../src/components/Modal";

const meta: Meta<typeof Modal> = {
  title: "SONAFRIK/Modal",
  component: Modal,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => (
    <Modal
      trigger={<Button variant="secondary">Ouvrir la modale</Button>}
      title="Confirmation"
      description="Êtes-vous sûr de vouloir continuer ?"
      footer={
        <>
          <Button variant="ghost">Annuler</Button>
          <Button>Confirmer</Button>
        </>
      }
    >
      <p className="text-sm text-texte-secondaire">Contenu de la modale SONAFRIK.</p>
    </Modal>
  ),
};
