import { DocumentsView } from "@/components/DocumentsView";

export const metadata = { title: "Devis et factures" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return <DocumentsView billing type={type === "devis" || type === "facture" ? type : undefined} />;
}
