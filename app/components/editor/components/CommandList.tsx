import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image,
  Table,
  Minus,
  AlertCircle,
  Sigma,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

// Map icon strings to components
const icons: Record<string, any> = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image,
  Table,
  Minus,
  AlertCircle,
  Sigma,
};

export const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length,
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (!props.items.length) {
    return null;
  }

  return (
    <div className="glass-panel rounded-lg shadow-xl overflow-hidden min-w-[280px] p-1 flex flex-col gap-0.5 bg-black/90 border border-white/10">
      {props.items.map((item: any, index: number) => {
        const Icon = icons[item.icon] || Type;
        return (
          <button
            className={twMerge(
              "flex items-center gap-3 w-full text-left px-3 py-2 rounded-md transition-colors",
              index === selectedIndex ? "bg-white/10" : "hover:bg-white/5",
            )}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className="p-1 rounded bg-white/5 border border-white/10 shrink-0">
              <Icon size={16} className="text-gray-300" />
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-200">
                {item.title}
              </span>
              <span className="text-xs text-gray-500">{item.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
});
