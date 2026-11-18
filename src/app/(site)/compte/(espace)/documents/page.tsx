import { DocumentsView } from "@/components/DocumentsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes documents" };
const KINDS = ["devis", "facture", "livrable", "maquette", "autre"];

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return <DocumentsView type={type && KINDS.includes(type) ? type : undefined} />;
}
