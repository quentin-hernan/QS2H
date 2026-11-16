import { LegalDoc } from "@/components/LegalPage";
import { LEGAL_DOCS } from "@/lib/legal-db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: LEGAL_DOCS.cgu.title, description: LEGAL_DOCS.cgu.description, path: LEGAL_DOCS.cgu.path });
export default async function Page({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  return <LegalDoc doc="cgu" version={(await searchParams).version} />;
}
