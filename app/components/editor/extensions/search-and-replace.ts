import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    search: {
      setSearchTerm: (term: string) => ReturnType;
      clearSearch: () => ReturnType;
      replaceSingle: (term: string, replacement: string) => ReturnType;
      replaceAll: (term: string, replacement: string) => ReturnType;
    };
  }
}

interface SearchOptions {
  searchTerm: string;
  resultClass: string;
}

interface SearchPluginState {
  searchTerm: string;
}

const searchPluginKey = new PluginKey<SearchPluginState>('search');

export const SearchAndReplace = Extension.create<SearchOptions>({
  name: 'search',

  addOptions() {
    return {
      searchTerm: '',
      resultClass: 'search-result',
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string) =>
        ({ state, dispatch }) => {
          this.options.searchTerm = term;
          if (dispatch) {
            dispatch(state.tr.setMeta(searchPluginKey, { term }));
          }
          return true;
        },
      clearSearch:
        () =>
        ({ state, dispatch }) => {
          this.options.searchTerm = '';
          if (dispatch) {
            dispatch(state.tr.setMeta(searchPluginKey, { term: '' }));
          }
          return true;
        },
      replaceSingle:
        (term: string, replacement: string) =>
        ({ state, dispatch }) => {
          if (!term) return false;

          const { doc } = state;
          let match: { from: number; to: number } | null = null;

          doc.descendants((node, pos) => {
            if (match) return false;
            if (!node.isText) return;

            const text = node.text || '';
            const index = text.indexOf(term);
            if (index !== -1) {
              match = { from: pos + index, to: pos + index + term.length };
            }
          });

          if (match && dispatch) {
            const { from, to } = match as { from: number; to: number };
            dispatch(
              state.tr
                .insertText(replacement, from, to)
                .scrollIntoView()
            );
            return true;
          }
          return false;
        },
      replaceAll:
        (term: string, replacement: string) =>
        ({ state, dispatch }) => {
          if (!term) return false;

          const { doc } = state;
          const tr = state.tr;
          const matches: { from: number; to: number }[] = [];

          doc.descendants((node, pos) => {
            if (!node.isText) return;
            const text = node.text || '';
            const regex = new RegExp(
              term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'gi'
            );
            let matchEntry;
            while ((matchEntry = regex.exec(text)) !== null) {
              matches.push({
                from: pos + matchEntry.index,
                to: pos + matchEntry.index + term.length,
              });
            }
          });

          if (matches.length === 0) return false;

          if (dispatch) {
            matches.sort((a, b) => b.from - a.from);
            matches.forEach((m) => {
              tr.insertText(replacement, m.from, m.to);
            });
            dispatch(tr);
          }

          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { resultClass } = this.options;

    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init() {
            return { searchTerm: '' };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(searchPluginKey);
            if (meta) {
              return { searchTerm: meta.term };
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            const pluginState = searchPluginKey.getState(state);
            const searchTerm = pluginState?.searchTerm;
            const { doc } = state;

            if (!searchTerm) return DecorationSet.empty;

            const decorations: Decoration[] = [];
            const regex = new RegExp(
              searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'gi'
            );

            doc.descendants((node, pos) => {
              if (!node.isText) return;

              const text = node.text || '';
              let match;
              while ((match = regex.exec(text)) !== null) {
                const from = pos + match.index;
                const to = from + searchTerm.length;
                decorations.push(
                  Decoration.inline(from, to, {
                    class: resultClass,
                  })
                );
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
