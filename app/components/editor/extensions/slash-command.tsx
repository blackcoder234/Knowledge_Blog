import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance } from "tippy.js";
import { CommandList } from "../components/CommandList";

// Define the items available in the slash command
export const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: "Text",
      description: "Just start writing with plain text.",
      searchTerms: ["p", "paragraph"],
      icon: "Type",
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode("paragraph").run();
      },
    },
    {
      title: "Heading 1",
      description: "Big section heading.",
      searchTerms: ["title", "big", "h1"],
      icon: "Heading1",
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading.",
      searchTerms: ["subtitle", "medium", "h2"],
      icon: "Heading2",
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "Heading 3",
      description: "Small section heading.",
      searchTerms: ["subtitle", "small", "h3"],
      icon: "Heading3",
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "Bullet List",
      description: "Create a simple bulleted list.",
      searchTerms: ["unordered", "point"],
      icon: "List",
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered List",
      description: "Create a list with numbering.",
      searchTerms: ["ordered"],
      icon: "ListOrdered",
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Task List",
      description: "Track tasks with a todo list.",
      searchTerms: ["todo", "task", "check"],
      icon: "CheckSquare",
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "Quote",
      description: "Capture a quote.",
      searchTerms: ["blockquote"],
      icon: "Quote",
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setBlockquote().run();
      },
    },
    {
      title: "Code Block",
      description: "Capture a code snippet.",
      searchTerms: ["codeblock"],
      icon: "Code",
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run();
      },
    },
    {
      title: "Math",
      description: "Insert a math equation.",
      searchTerms: ["latex", "equation"],
      icon: "Sigma",
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setMathEquation().run();
      },
    },
    {
      title: "Image",
      description: "Upload an image from your computer.",
      searchTerms: ["photo", "picture", "media"],
      icon: "Image",
      command: ({ editor, range }: any) => {
        // Delete the slash command text first
        editor.chain().focus().deleteRange(range).run();

        // Trigger the toolbar file input
        // We find the input by ID or Class since we can't easily pass refs here without Context,
        // but for now let's rely on a DOM lookup or a custom event if possible.
        // EASIER: Just click the toolbar button programmatically if we can find it,
        // OR better: dispatch a custom event that the Toolbar listens to.

        // Let's use a simpler approach: dispatch a custom event "trigger-image-upload"
        window.dispatchEvent(new Event("trigger-image-upload"));
      },
    },
    {
      title: "Table",
      description: "Add a table for structured data.",
      searchTerms: ["grid"],
      icon: "Table",
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    },
    {
      title: "YouTube",
      description: "Embed a YouTube video.",
      searchTerms: ["video", "youtube", "embed"],
      icon: "Youtube",
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        window.dispatchEvent(new Event("open-youtube-modal"));
      },
    },
    {
      title: "Divider",
      description: "Visually divide content.",
      searchTerms: ["hr", "line"],
      icon: "Minus",
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: "Callout",
      description: "Make text stand out.",
      searchTerms: ["box", "note"],
      icon: "AlertCircle",
      // Note: We'll simulate callout with a styled blockquote for now as we don't have a dedicated callout extension installed yet
      // Ideally you'd create a custom node for Callout. Using Blockquote with class for now if needed or just blockquote.
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
  ]
    .filter((item) => {
      if (typeof query === "string" && query.length > 0) {
        const search = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          (item.searchTerms &&
            item.searchTerms.some((term: string) => term.includes(search)))
        );
      }
      return true;
    })
    .slice(0, 10);
};

let component: ReactRenderer<any>;
let popup: Instance[];

export const renderSuggestionItems = () => {
  return {
    onStart: (props: any) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      // @ts-ignore
      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate: (props: any) => {
      component.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown: (props: any) => {
      if (props.event.key === "Escape") {
        popup[0].hide();
        return true;
      }
      // Forward key events to the component instance
      return (component.ref as any)?.onKeyDown(props);
    },

    onExit: () => {
      popup[0].destroy();
      component.destroy();
    },
  };
};

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
