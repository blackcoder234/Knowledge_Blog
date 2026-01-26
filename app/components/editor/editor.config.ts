import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { ImageResizeExtension } from '@/app/components/editor/extensions/image-resize/index';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Focus from '@tiptap/extension-focus'; // Focus mode class
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { MathEquationBlock } from '@/app/components/editor/extensions/math-equation';
import { SlashCommand, getSuggestionItems, renderSuggestionItems } from '@/app/components/editor/extensions/slash-command';
import { CodeBlockComponent } from '@/app/components/editor/components/CodeBlockComponent';
import { ReactNodeViewRenderer } from '@tiptap/react';
import Youtube from '@tiptap/extension-youtube';
import { SearchAndReplace } from '@/app/components/editor/extensions/search-and-replace';
import { SmartPaste } from '@/app/components/editor/extensions/smart-paste';

import CharacterCount from '@tiptap/extension-character-count';

// Create a lowlight instance with common languages
const lowlight = createLowlight(common);

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    blockquote: false,
    bulletList: false,
    orderedList: false,
    dropcursor: {
      color: '#3b82f6',
      width: 2,
    },
    codeBlock: false,
  }),
  Blockquote.extend({
    addAttributes() {
      return {
        class: {
          default: 'border-l-4 border-gray-300 pl-4 italic',
          parseHTML: (element) => element.getAttribute('class'),
          renderHTML: (attributes) => {
            return { class: attributes.class };
          },
        },
      };
    },
  }),
  BulletList.extend({
    addAttributes() {
      return {
        class: {
          default: 'list-disc list-outside leading-3 -mt-2',
          parseHTML: (element) => element.getAttribute('class'),
          renderHTML: (attributes) => {
             return { class: attributes.class };
          },
        },
      };
    },
  }),
  OrderedList.extend({
    addAttributes() {
      return {
        class: {
          default: 'list-decimal list-outside leading-3 -mt-2',
          parseHTML: (element) => element.getAttribute('class'),
          renderHTML: (attributes) => {
             return { class: attributes.class };
          },
        },
      };
    },
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors',
    },
  }),
  ImageResizeExtension,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return 'What’s the title?';
      }
      return 'Tell your story...';
    },
    emptyEditorClass: 'is-editor-empty',
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'my-6 rounded-lg overflow-hidden border border-gray-700',
    },
  }),
  TableRow,
  TableHeader,
  TableCell,
  CodeBlockLowlight.configure({
    lowlight,
    // HTMLAttributes removed as NodeView handles styling
  }).extend({
    addNodeView() {
      return ReactNodeViewRenderer(CodeBlockComponent);
    },
  }),
  Focus.configure({
    className: 'has-focus',
    mode: 'all',
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: 'not-prose pl-2',
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: 'flex gap-2 items-start my-1',
    },
  }),
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  Subscript,
  Superscript,
  MathEquationBlock,
  Youtube.configure({
    controls: true,
    nocookie: true,
  }),
  SearchAndReplace,
  SmartPaste,

  CharacterCount.configure({
    mode: 'textSize', // This ensures it counts text accurately
  }),
  SlashCommand.configure({
    suggestion: {
      items: getSuggestionItems,
      render: renderSuggestionItems,
    },
  }),
];
