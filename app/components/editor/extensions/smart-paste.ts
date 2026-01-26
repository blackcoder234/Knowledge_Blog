import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const SmartPaste = Extension.create({
  name: 'smartPaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('smartPaste'),
        props: {
          handlePaste: (view, event) => {
            const pastedText = event.clipboardData?.getData('text/plain');
            if (!pastedText) return false;

            const { state } = view;
            const { selection } = state;
            const { from, to } = selection;
            const schema = view.state.schema;

            // 1. YouTube Link Detection
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
            if (youtubeRegex.test(pastedText.trim())) {
              view.dispatch(state.tr.replaceWith(from, to, schema.nodes.youtube.create({ src: pastedText.trim() })));
              return true;
            }

            // 2. Code Block Detection Patterns
            const codePatterns = [
                /function\s+\w+\s*\(/,
                /const\s+\w+\s*=\s*/,
                /import\s+.*\s+from/,
                /class\s+\w+\s*\{/,
                /public\s+static\s+void\s+main/,
                /^\s*<\w+.*>.*<\/\w+>/m
            ];
            
            if (codePatterns.some((pattern: RegExp) => pattern.test(pastedText)) && pastedText.split('\n').length > 2) {
                view.dispatch(state.tr.replaceWith(from, to, schema.nodes.codeBlock.create(null, schema.text(pastedText))));
                return true;
            }

            // 3. Table Detection (CSV/TSV)
            const lines = pastedText.trim().split('\n');
            if (lines.length > 2) {
                const head = lines[0];
                const cleanHead = head.trim();
                const separator = cleanHead.includes('\t') ? '\t' : (cleanHead.includes(',') ? ',' : null);
                
                if (separator) {
                    const columns = head.split(separator).length;
                    const isValidTable = columns > 1 && lines.every(line => line.split(separator).length === columns);

                    if (isValidTable) {
                        try {
                            const tableRows: any[] = [];
                            lines.forEach((line) => {
                                const cells = line.split(separator).map((cellText) => {
                                     // Just a basic cell with a paragraph
                                     const p = view.state.schema.nodes.paragraph.create(null, cellText ? view.state.schema.text(cellText) : []);
                                     return view.state.schema.nodes.tableCell.create(null, p); 
                                });
                                tableRows.push(view.state.schema.nodes.tableRow.create(null, cells));
                            });
                            
                            const table = view.state.schema.nodes.table.create(null, tableRows);
                            const tr = view.state.tr.replaceSelectionWith(table);
                            view.dispatch(tr);
                            return true;
                        } catch (e) {
                            console.error('Table creation failed', e);
                        }
                    }
                }
            }

            // 4. Bullet List Detection
            const bulletLines = pastedText.trim().split('\n');
            const isBulletList = bulletLines.length > 1 && bulletLines.every(line => {
                const t = line.trim();
                return t.startsWith('- ') || t.startsWith('* ');
            });

            if (isBulletList) {
                const listItems: any[] = [];
                bulletLines.forEach((line) => {
                    const text = line.trim().substring(2);
                    const p = view.state.schema.nodes.paragraph.create(null, text ? view.state.schema.text(text) : []);
                    listItems.push(view.state.schema.nodes.listItem.create(null, p));
                });
                
                const list = view.state.schema.nodes.bulletList.create(null, listItems);
                const tr = view.state.tr.replaceSelectionWith(list);
                view.dispatch(tr);
                return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
