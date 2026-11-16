import { LegalDoc } from "@/components/LegalPage";
import { LEGAL_DOCS } from "@/lib/legal-db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: LEGAL_DOCS.mentions.title, description: LEGAL_DOCS.mentions.description, path: LEGAL_DOCS.mentions.path });
export default async function Page({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  return <LegalDoc doc="mentions" version={(await searchParams).version} />;
}
