import { LegalDoc } from "@/components/LegalPage";
import { LEGAL_DOCS } from "@/lib/legal-db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: LEGAL_DOCS.cookies.title, description: LEGAL_DOCS.cookies.description, path: LEGAL_DOCS.cookies.path });
export default async function Page({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  return <LegalDoc doc="cookies" version={(await searchParams).version} />;
}
