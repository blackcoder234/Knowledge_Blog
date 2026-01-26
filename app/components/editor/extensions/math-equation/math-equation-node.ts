import { Node, mergeAttributes, InputRule, PasteRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MathEquationComponent } from './MathEquationComponent';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathEquation: {
      /**
       * Add a math equation
       */
      setMathEquation: (options?: { latex?: string; isBlock?: boolean }) => ReturnType;
    };
  }
}

export const MathEquationBlock = Node.create({
  name: 'mathEquation',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-latex'),
        renderHTML: (attributes) => {
          return {
            'data-latex': attributes.latex,
          };
        },
      },
      isBlock: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-is-block') === 'true',
        renderHTML: (attributes) => {
          return {
            'data-is-block': attributes.isBlock ? 'true' : 'false',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-equation"]',
      },
      {
        tag: 'span.math-equation',
        getAttrs: (node) => {
           if (typeof node === 'string') return {};
           const element = node as HTMLElement;
           return {
             latex: element.getAttribute('data-latex'),
             isBlock: element.getAttribute('data-is-block') === 'true',
           };
        },
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'math-equation', class: 'math-equation' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathEquationComponent);
  },

  addCommands() {
    return {
      setMathEquation:
        ({ latex = '', isBlock = false } = {}) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { latex, isBlock },
            })
            .run();
        },
    };
  },

  addInputRules() {
    return [
      inputRules.inlineMath(this.type),
      inputRules.blockMath(this.type),
    ];
  },

  addPasteRules() {
    return [
      pasteRules.inlineMath(this.type),
      pasteRules.blockMath(this.type),
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Optional: Add shortcut if needed, e.g. '$' to trigger?
      // For now, no implicit shortcut unless requested, just the node capability.
    };
  },
});

export const inputRules = {
  inlineMath: (type: any) =>
    new InputRule({
      find: /\$(.+?)\$/,
      handler: ({ state, range, match }) => {
        const { from, to } = range;
        const latex = match[1];
        if (latex) {
          state.tr.replaceWith(from, to, type.create({ latex, isBlock: false }));
        }
      },
    }),
  blockMath: (type: any) =>
    new InputRule({
      find: /\$\$(.+?)\$\$/,
      handler: ({ state, range, match }) => {
        const { from, to } = range;
        const latex = match[1];
        if (latex) {
          state.tr.replaceWith(from, to, type.create({ latex, isBlock: true }));
        }
      },
    }),
};

export const pasteRules = {
  inlineMath: (type: any) =>
    new PasteRule({
      find: /\$(.+?)\$/g,
      handler: ({ state, range, match }) => {
        const { from, to } = range;
        const latex = match[1];
        if (latex) {
          state.tr.replaceWith(from, to, type.create({ latex, isBlock: false }));
        }
      },
    }),
  blockMath: (type: any) =>
    new PasteRule({
      find: /\$\$(.+?)\$\$/g,
      handler: ({ state, range, match }) => {
        const { from, to } = range;
        const latex = match[1];
        if (latex) {
          state.tr.replaceWith(from, to, type.create({ latex, isBlock: true }));
        }
      },
    }),
};
