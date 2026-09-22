import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import type { ReactNode } from "react";

interface TiptapEditorProps {
  initialContent: string;
  onUpdate: (payload: { html: string; text: string }) => void;
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs ${
        active
          ? "bg-zinc-700 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({ initialContent, onUpdate }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        strike: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onUpdate({ html: editor.getHTML(), text: editor.getText() });
    },
  });

  if (!editor) return null;

  function setLink() {
    const previousUrl = editor?.getAttributes("link").href as
      | string
      | undefined;
    const url = window.prompt("URL", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-wrap gap-1 border-b border-zinc-800 pb-2">
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </ToolbarButton>
        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          title="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          "
        </ToolbarButton>
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          title="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          title="Link"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          Link
        </ToolbarButton>
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          ↺
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          ↻
        </ToolbarButton>
      </div>

        <EditorContent
        editor={editor}
        className="flex-1 overflow-y-auto rounded border border-zinc-800 bg-zinc-900 p-3 text-sm leading-relaxed text-zinc-100 [&_.ProseMirror]:h-full [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-blue-400 [&_.ProseMirror_a]:underline [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-zinc-700 [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:text-zinc-400 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_li]:my-0.5 [&_.ProseMirror_li_p]:my-0"
      />
    </div>
  );
}