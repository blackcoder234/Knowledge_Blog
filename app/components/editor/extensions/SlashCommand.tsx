import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Minus,
  Sigma,
  AlertCircle,
  Type,
  Workflow,
} from "lucide-react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

// Command List Component
const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length,
        );
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-[#121212] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden min-w-[300px] max-h-[320px] overflow-y-auto p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 scrollbar-hide">
      <div className="text-[10px] font-bold text-zinc-500 px-3 py-2 uppercase tracking-wider">
        Basic Blocks
      </div>
      {props.items.length > 0 ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            className={`flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
              index === selectedIndex
                ? "bg-cyan-500/10 text-cyan-400"
                : "text-zinc-300 hover:bg-zinc-800"
            }`}
            onClick={() => selectItem(index)}
          >
            <div
              className={`p-1 rounded ${index === selectedIndex ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-800 text-zinc-400"}`}
            >
              {item.icon}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{item.title}</span>
              {item.description && (
                <span className="text-[10px] text-zinc-500 leading-tight">
                  {item.description}
                </span>
              )}
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-zinc-500 text-sm">No commands found</div>
      )}
    </div>
  );
});

CommandList.displayName = "CommandList";

// Suggestion Config
const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: "Text",
      description: "Just start typing with plain text.",
      icon: <Type size={16} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setParagraph().run();
      },
    },
    {
      title: "Heading 1",
      description: "Big section heading.",
      icon: <Heading1 size={16} />,
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
      icon: <Heading2 size={16} />,
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
      icon: <Heading3 size={16} />,
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
      icon: <List size={16} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Ordered List",
      description: "Create a numbered list.",
      icon: <ListOrdered size={16} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Quote",
      description: "Capture a quote.",
      icon: <Quote size={16} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "Callout",
      description: "Highlight important information.",
      icon: <AlertCircle size={16} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setCallout().run();
      },
    },
    {
      title: "Math Equation",
      description: "Insert a LaTeX equation.",
      icon: <Sigma size={16} />,
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({ type: "math" })
          .run();
      },
    },
    {
      title: "Mermaid Diagram",
      description: "Insert a flowchart or graph.",
      icon: <Workflow size={16} />,
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({ type: "mermaid" })
          .run();
      },
    },
    {
      title: "Code Block",
      description: "Capture a code snippet.",
      icon: <Code size={16} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "Divider",
      description: "Visually separate content.",
      icon: <Minus size={16} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: "Image",
      description: "Upload an image from your computer.",
      icon: <ImageIcon size={16} />,
      command: ({ editor, range }: any) => {
        // We just delete the slash command range first
        editor.chain().focus().deleteRange(range).run();
        // Since we can't trigger file upload easily here, use a placeholder
        // or rely on toolbar. For now, let's allow adding via URL prompt as fallback
        const url = prompt("Enter Image URL:");
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      },
    },
    {
      title: "Youtube",
      description: "Embed a video.",
      icon: <YoutubeIcon size={16} />,
      command: ({ editor, range }: any) => {
        const url = prompt("Enter YouTube URL");
        if (url) {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setYoutubeVideo({ src: url })
            .run();
        }
      },
    },
  ]
    .filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 10);
};

// Render Logic
const renderSuggestion = () => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

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

    onUpdate(props: any) {
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === "Escape") {
        popup[0].hide();
        return true;
      }
      return (component?.ref as any)?.onKeyDown(props);
    },

    onExit() {
      popup[0].destroy();
      component?.destroy();
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

// Export default config to plug into editor
export const slashCommandConfig = {
  suggestion: {
    items: getSuggestionItems,
    render: renderSuggestion,
  },
};
