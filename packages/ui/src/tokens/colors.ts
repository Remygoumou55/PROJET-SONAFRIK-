/** Couleurs officielles SONAFRIK — Territory 8
 * Legacy V5.0 noms conservés pour compatibilité mobile ; valeurs rebranchées sur T8 */

import { territory8Colors, territory8ColorCssVarMap, territory8Borders } from "./territory8";

export const colors = {
  vertEnergie: territory8Colors.primaryLavender,
  vertProfond: territory8Colors.primaryLavenderDeep,
  orSolaire: territory8Colors.audioCyan,
  orProfond: territory8Colors.audioCyanDeep,
  noirProfond: territory8Colors.pearlBlack,
  surface: territory8Colors.surface01,
  card: territory8Colors.surface02,
  elevated: territory8Colors.surface03,
  bordure: territory8Borders.default,
  textePrincipal: territory8Colors.pearl,
  texteSecondaire: territory8Colors.silver,
  texteDesactive: territory8Colors.silverDeep,
  error: territory8Colors.error,
  success: territory8Colors.success,
  warning: territory8Colors.warning,

  // Couleurs alpha — mappées sur les tokens T8 (legacy noms)
  vertEnergie10: "rgba(200, 75, 255, 0.10)",
  vertEnergie13: "rgba(200, 75, 255, 0.13)",
  vertEnergie20: "rgba(200, 75, 255, 0.20)",
  orSolaire10: "rgba(69, 230, 255, 0.10)",
  orSolaire13: "rgba(69, 230, 255, 0.13)",
  orSolaire20: "rgba(69, 230, 255, 0.20)",
  orSolaire27: "rgba(69, 230, 255, 0.27)",
  blanc13: "rgba(247, 243, 255, 0.13)",
  blanc53: "rgba(247, 243, 255, 0.53)",
  blanc60: "rgba(247, 243, 255, 0.60)",
  blanc80: "rgba(247, 243, 255, 0.80)",
  noir20: "rgba(7, 6, 11, 0.20)",
  error10: "rgba(255, 92, 120, 0.10)",
  error13: "rgba(255, 92, 120, 0.13)",
  orNoir: "rgba(7, 6, 11, 1)",
} as const;

export type SonafrikColor = keyof typeof colors;

export const cssVarMap: Record<SonafrikColor, string> = {
  vertEnergie: territory8ColorCssVarMap.primaryLavender,
  vertProfond: territory8ColorCssVarMap.primaryLavenderDeep,
  orSolaire: territory8ColorCssVarMap.audioCyan,
  orProfond: territory8ColorCssVarMap.audioCyanDeep,
  noirProfond: territory8ColorCssVarMap.pearlBlack,
  surface: territory8ColorCssVarMap.surface01,
  card: territory8ColorCssVarMap.surface02,
  elevated: territory8ColorCssVarMap.surface03,
  bordure: territory8Borders.default,
  textePrincipal: territory8ColorCssVarMap.pearl,
  texteSecondaire: territory8ColorCssVarMap.silver,
  texteDesactive: territory8ColorCssVarMap.silverDeep,
  error: territory8ColorCssVarMap.error,
  success: territory8ColorCssVarMap.success,
  warning: territory8ColorCssVarMap.warning,

  // Alpha — pas de variable CSS dédiée, valeur RGBA directe
  vertEnergie10: "rgba(200, 75, 255, 0.10)",
  vertEnergie13: "rgba(200, 75, 255, 0.13)",
  vertEnergie20: "rgba(200, 75, 255, 0.20)",
  orSolaire10: "rgba(69, 230, 255, 0.10)",
  orSolaire13: "rgba(69, 230, 255, 0.13)",
  orSolaire20: "rgba(69, 230, 255, 0.20)",
  orSolaire27: "rgba(69, 230, 255, 0.27)",
  blanc13: "rgba(247, 243, 255, 0.13)",
  blanc53: "rgba(247, 243, 255, 0.53)",
  blanc60: "rgba(247, 243, 255, 0.60)",
  blanc80: "rgba(247, 243, 255, 0.80)",
  noir20: "rgba(7, 6, 11, 0.20)",
  error10: "rgba(255, 92, 120, 0.10)",
  error13: "rgba(255, 92, 120, 0.13)",
  orNoir: "rgba(7, 6, 11, 1)",
};
