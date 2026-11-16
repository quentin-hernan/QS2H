import { LegalDoc } from "@/components/LegalPage";
import { LEGAL_DOCS } from "@/lib/legal-db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: LEGAL_DOCS.confidentialite.title, description: LEGAL_DOCS.confidentialite.description, path: LEGAL_DOCS.confidentialite.path });
export default async function Page({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  return <LegalDoc doc="confidentialite" version={(await searchParams).version} />;
}
