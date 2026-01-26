import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Trash2,
  Columns,
  Rows,
  Merge,
  Split,
  ArrowBigLeft,
  ArrowBigRight,
  ArrowBigUp,
  ArrowBigDown,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

interface TableMenuProps {
  editor: Editor | null;
}

const TableBtn = ({
  onClick,
  title,
  children,
  className,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={twMerge(
      "p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors",
      className,
    )}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-4 bg-white/10 mx-1 self-center" />;

export const TableMenu = ({ editor }: TableMenuProps) => {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableMenu"
      shouldShow={({ editor }: { editor: Editor }) => editor.isActive("table")}
      className="flex items-center gap-0.5 p-1.5 rounded-lg bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in zoom-in-95"
    >
      {/* Column Controls */}
      <div className="flex gap-0.5">
        <TableBtn
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          title="Add Column Before"
        >
          <div className="flex items-center">
            <Columns size={14} className="mr-1" />
            <ArrowBigLeft size={10} />
          </div>
        </TableBtn>
        <TableBtn
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          title="Add Column After"
        >
          <div className="flex items-center">
            <Columns size={14} className="mr-1" />
            <ArrowBigRight size={10} />
          </div>
        </TableBtn>
        <TableBtn
          onClick={() => editor.chain().focus().deleteColumn().run()}
          title="Delete Column"
          className="hover:text-red-400"
        >
          <div className="relative">
            <Columns size={14} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-current rotate-45" />
            </div>
          </div>
        </TableBtn>
      </div>

      <Divider />

      {/* Row Controls */}
      <div className="flex gap-0.5">
        <TableBtn
          onClick={() => editor.chain().focus().addRowBefore().run()}
          title="Add Row Before"
        >
          <div className="flex items-center">
            <Rows size={14} className="mr-1" />
            <ArrowBigUp size={10} />
          </div>
        </TableBtn>
        <TableBtn
          onClick={() => editor.chain().focus().addRowAfter().run()}
          title="Add Row After"
        >
          <div className="flex items-center">
            <Rows size={14} className="mr-1" />
            <ArrowBigDown size={10} />
          </div>
        </TableBtn>
        <TableBtn
          onClick={() => editor.chain().focus().deleteRow().run()}
          title="Delete Row"
          className="hover:text-red-400"
        >
          <div className="relative">
            <Rows size={14} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-current rotate-45" />
            </div>
          </div>
        </TableBtn>
      </div>

      <Divider />

      {/* Cell Controls */}
      <div className="flex gap-0.5">
        <TableBtn
          onClick={() => editor.chain().focus().mergeCells().run()}
          title="Merge Cells"
        >
          <Merge size={16} />
        </TableBtn>
        <TableBtn
          onClick={() => editor.chain().focus().splitCell().run()}
          title="Split Cell"
        >
          <Split size={16} />
        </TableBtn>
      </div>

      <Divider />

      {/* Delete Table */}
      <TableBtn
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Delete Table"
        className="hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 size={16} />
      </TableBtn>
    </BubbleMenu>
  );
};
