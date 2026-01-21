import { Extension, PasteRule } from "@tiptap/core";

export const MarkdownPasteLogic = Extension.create({
  name: "markdownPaste",

  addPasteRules() {
    return [
      // H1: # Heading
      new PasteRule({
        find: /^(?:#\s)(.+)$/gm,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          if (match[1]) {
            tr.replaceWith(
              range.from,
              range.to,
              state.schema.nodes.heading.create(
                { level: 1 },
                state.schema.text(match[1]),
              ),
            );
          }
        },
      }),
      // H2: ## Heading
      new PasteRule({
        find: /^(?:##\s)(.+)$/gm,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          if (match[1]) {
            tr.replaceWith(
              range.from,
              range.to,
              state.schema.nodes.heading.create(
                { level: 2 },
                state.schema.text(match[1]),
              ),
            );
          }
        },
      }),
      // H3: ### Heading
      new PasteRule({
        find: /^(?:###\s)(.+)$/gm,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          if (match[1]) {
            tr.replaceWith(
              range.from,
              range.to,
              state.schema.nodes.heading.create(
                { level: 3 },
                state.schema.text(match[1]),
              ),
            );
          }
        },
      }),
    ];
  },
});
