"use client";
import { useViewer } from "./ProjectViewer";

export function OpenViewer({ slug }: { slug: string }) {
  const v = useViewer();
  return <button type="button" className="btn btn-primary" onClick={() => v.open(slug)}>Ouvrir la vue éclatée</button>;
}
