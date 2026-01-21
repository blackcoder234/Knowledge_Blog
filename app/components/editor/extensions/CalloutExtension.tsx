import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import React from "react";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle,
  Flame,
} from "lucide-react";

export type CalloutType = "info" | "warning" | "success" | "tip" | "danger";

interface CalloutAttributes {
  type: CalloutType;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attributes?: { type: CalloutType }) => ReturnType;
      toggleCallout: (attributes?: { type: CalloutType }) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

const CalloutComponent = ({ node, updateAttributes, extension }: any) => {
  const type = node.attrs.type as CalloutType;

  // Configuration for each type
  const config = {
    info: {
      icon: Info,
      color: "border-blue-500 bg-blue-500/10 text-blue-200",
      iconColor: "text-blue-400",
      label: "Info",
    },
    warning: {
      icon: AlertTriangle,
      color: "border-yellow-500 bg-yellow-500/10 text-yellow-200",
      iconColor: "text-yellow-400",
      label: "Warning",
    },
    success: {
      icon: CheckCircle,
      color: "border-green-500 bg-green-500/10 text-green-200",
      iconColor: "text-green-400",
      label: "Success",
    },
    tip: {
      icon: Lightbulb,
      color: "border-purple-500 bg-purple-500/10 text-purple-200",
      iconColor: "text-purple-400",
      label: "Tip",
    },
    danger: {
      icon: Flame,
      color: "border-red-500 bg-red-500/10 text-red-200",
      iconColor: "text-red-400",
      label: "Danger",
    },
  };

  const currentConfig = config[type] || config.info;
  const Icon = currentConfig.icon;

  return (
    <NodeViewWrapper
      className={`my-6 rounded-lg border-l-4 p-4 ${currentConfig.color}`}
    >
      <div className="flex gap-3 items-start">
        <div
          className={`mt-0.5 ${currentConfig.iconColor} select-none`}
          contentEditable={false}
        >
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Interaction Menu to change Type */}
          <div className="flex gap-2 mb-2 opacity-0 hover:opacity-100 transition-opacity absolute right-4 top-2 bg-black/50 backdrop-blur rounded p-1">
            {(Object.keys(config) as CalloutType[]).map((t) => (
              <button
                key={t}
                onClick={() => updateAttributes({ type: t })}
                className={`w-3 h-3 rounded-full ${t === type ? "ring-2 ring-white" : ""} ${
                  t === "info"
                    ? "bg-blue-500"
                    : t === "warning"
                      ? "bg-yellow-500"
                      : t === "success"
                        ? "bg-green-500"
                        : t === "tip"
                          ? "bg-purple-500"
                          : "bg-red-500"
                }`}
                title={t}
              />
            ))}
          </div>
          <NodeViewContent className="outline-none" />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const CalloutExtension = Node.create<CalloutAttributes>({
  name: "callout",

  group: "block",

  content: "block+",

  draggable: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) =>
          element.getAttribute("data-type") as CalloutType,
        renderHTML: (attributes) => ({
          "data-type": attributes.type,
          class: `callout callout-${attributes.type}`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },

  addCommands() {
    return {
      setCallout:
        (attributes = { type: "info" }) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes = { type: "info" }) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});
