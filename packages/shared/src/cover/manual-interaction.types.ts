/**
 * Manual Interaction Engine — actions utilisateur sur la pochette (wizard étape 2).
 * Aucune logique automatique : sélection, changement, recadrage avancé optionnel.
 */
export type CoverManualAction =
  | "select_file"
  | "drop_file"
  | "change_image"
  | "adjust_crop"
  | "continue_wizard";
