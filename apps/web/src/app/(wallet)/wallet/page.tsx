import type { Metadata } from "next";
import { WalletClient } from "./WalletClient";

export const metadata: Metadata = { title: "Portefeuille — SONAFRIK" };

export default function WalletPage() {
  return <WalletClient />;
}
