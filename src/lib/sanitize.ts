import sanitizeHtml from "sanitize-html";

/** Assainit le HTML produit par l'éditeur riche (articles). Liste blanche stricte. */
export function cleanHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "a", "img", "hr", "code", "pre"],
    allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height", "loading"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tag, attribs) => ({ tagName: "a", attribs: { ...attribs, ...(attribs.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {}) } }),
      img: (tag, attribs) => ({ tagName: "img", attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}
