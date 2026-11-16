"use client";
import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { MediaPicker } from "./MediaPicker";

/** Éditeur riche (Tiptap). Le HTML produit est assaini côté serveur à l'enregistrement ET avant affichage. */
export function RichText({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [pick, setPick] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Link.configure({ openOnClick: false, autolink: true }), Image],
    content: value,
    editorProps: { attributes: { class: "prose-qs min-h-[320px] rounded-b-xl border border-t-0 p-5 outline-none focus:ring-2", style: "border-color:rgb(242 239 233 / .22);max-width:none", "aria-label": "Contenu de l'article" } },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });
  if (!editor) return <div className="field min-h-[360px]" aria-busy="true" />;
  const B = ({ on, active, label, children }: { on: () => void; active?: boolean; label: string; children: React.ReactNode }) => (
    <button type="button" onClick={on} aria-label={label} aria-pressed={active} title={label} className={`min-h-[40px] min-w-[40px] rounded-lg px-2.5 text-sm transition-colors ${active ? "bg-ivory text-ink-900" : "hover:bg-white/10"}`}>{children}</button>
  );
  const link = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Adresse du lien (https://…)", prev || "https://");
    if (url === null) return;
    if (url === "") return editor.chain().focus().unsetLink().run();
    if (!/^(https?:|mailto:|tel:|\/)/.test(url)) return alert("Adresse non valide.");
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-xl border p-2" style={{ borderColor: "rgb(242 239 233 / .22)" }} role="toolbar" aria-label="Mise en forme">
        <B on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} label="Titre de section">H2</B>
        <B on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} label="Sous-titre">H3</B>
        <B on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Gras"><strong>G</strong></B>
        <B on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italique"><em>I</em></B>
        <B on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="Liste à puces">• Liste</B>
        <B on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="Liste numérotée">1. Liste</B>
        <B on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="Citation">« »</B>
        <B on={link} active={editor.isActive("link")} label="Lien">Lien</B>
        <B on={() => setPick(true)} label="Insérer une image">Image</B>
        <span className="mx-1 h-5 w-px bg-white/20" aria-hidden="true" />
        <B on={() => editor.chain().focus().undo().run()} label="Annuler">↶</B>
        <B on={() => editor.chain().focus().redo().run()} label="Rétablir">↷</B>
      </div>
      <EditorContent editor={editor} />
      <MediaPicker open={pick} onClose={() => setPick(false)} onPick={(m) => { editor.chain().focus().setImage({ src: m.url, alt: m.alt }).run(); setPick(false); }} />
    </div>
  );
}
