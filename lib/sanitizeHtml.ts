import sanitizeHtml from "sanitize-html";

const ARTICLE_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "a", "blockquote", "br", "code", "del", "div", "em", "figcaption",
    "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
    "li", "ol", "p", "pre", "s", "strong", "sub", "sup", "table", "tbody",
    "td", "th", "thead", "tr", "u", "ul",
  ],
  allowedAttributes: {
    "*": ["class"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
  transformTags: {
    a: (tagName, attributes) => ({
      tagName,
      attribs: {
        ...attributes,
        ...(attributes.target === "_blank"
          ? { rel: "noopener noreferrer" }
          : {}),
      },
    }),
  },
};

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, ARTICLE_HTML_OPTIONS);
}

export function serializeJsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
