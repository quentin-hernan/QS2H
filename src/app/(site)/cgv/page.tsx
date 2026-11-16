import { LegalDoc } from "@/components/LegalPage";
import { LEGAL_DOCS } from "@/lib/legal-db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: LEGAL_DOCS.cgv.title, description: LEGAL_DOCS.cgv.description, path: LEGAL_DOCS.cgv.path });
export default async function Page({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  return <LegalDoc doc="cgv" version={(await searchParams).version} />;
}
