"use client"

// ============================================================================
// Rich text editor
// ============================================================================
//
// The schema below is deliberately the *exact* set of tags the backend
// sanitiser allows (backend/core/content/sanitize.py). That equivalence is
// the point: a general-purpose editor lets someone paste a heading, a table
// or a coloured span, shows it happily, and then nh3 strips it on save — so
// the stored copy silently differs from what they approved. Here the editor
// cannot produce anything that would be stripped, including on paste, since
// ProseMirror coerces pasted markup into the schema.
//
// Allow-list mirrored: p br strong em u mark · h2 h3 h4 · ul ol li ·
// blockquote · hr · a[href] · img[src,alt]
//
// `h1` is absent on purpose. The page renders its own `<h1>`, and a second
// one inside the body is a document-outline error on every article.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import Bold from "@tiptap/extension-bold"
import Italic from "@tiptap/extension-italic"
import Underline from "@tiptap/extension-underline"
import HardBreak from "@tiptap/extension-hard-break"
import Heading from "@tiptap/extension-heading"
import Blockquote from "@tiptap/extension-blockquote"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list"
import { Placeholder, UndoRedo } from "@tiptap/extensions"
import {
  Bold as BoldIcon,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic as ItalicIcon,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react"
import { toast } from "sonner"

import { uploadImage, UploadError } from "@/lib/api/admin/media"

const EXTENSIONS = [
  Document,
  Paragraph,
  Text,
  Bold, // <strong>
  Italic, // <em>
  Underline, // <u>
  HardBreak, // <br>
  Heading.configure({ levels: [2, 3, 4] }),
  BulletList,
  OrderedList,
  ListItem,
  Blockquote,
  HorizontalRule,
  Image.configure({ inline: false, allowBase64: false }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    // Mirrors ALLOWED_SCHEMES: anything else is not a link.
    protocols: ["http", "https", "mailto", "tel"],
    HTMLAttributes: { rel: "noopener noreferrer" },
  }),
  UndoRedo,
]

/** An empty editor serialises to `<p></p>`; store nothing instead. */
function normalise(html: string): string {
  return html === "<p></p>" || html.trim() === "" ? "" : html
}

export default function RichTextField({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  invalid,
  describedBy,
  rows = 12,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  invalid?: boolean
  describedBy?: string
  /** Roughly how many lines tall the box should start. */
  rows?: number
}) {
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      ...EXTENSIONS,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value || "",
    // Client-only: ProseMirror measures the DOM on mount, and letting
    // Next prerender it produces a hydration mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        class: "admin-prose px-3 py-2.5 outline-none",
        style: `min-height: ${rows * 1.6}rem`,
        ...(invalid ? { "aria-invalid": "true" } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(normalise(editor.getHTML())),
    onBlur: () => onBlur?.(),
  })

  // Re-sync when the form loads a different row. Guarded on the
  // serialised value, or every keystroke would reset the caret to the end.
  useEffect(() => {
    if (!editor) return

    if (normalise(editor.getHTML()) !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
  }, [value, editor])

  const insertImage = useCallback(
    async (file: File | undefined) => {
      if (!file || !editor) return

      setUploading(true)

      try {
        const media = await uploadImage(file)

        editor.chain().focus().setImage({ src: media.url, alt: "" }).run()
      } catch (error) {
        toast.error(
          error instanceof UploadError
            ? error.message
            : "Upload failed.",
        )
      } finally {
        setUploading(false)

        // Cleared so re-picking the same file still fires `change`.
        if (fileInput.current) fileInput.current.value = ""
      }
    },
    [editor],
  )

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white transition-colors focus-within:border-gray-900 ${
        invalid ? "border-red-300" : "border-gray-200"
      }`}
    >
      <Toolbar
        editor={editor}
        uploading={uploading}
        onPickImage={() => fileInput.current?.click()}
      />

      <EditorContent editor={editor} />

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => insertImage(event.target.files?.[0])}
      />
    </div>
  )
}

// ============================================================================
// Toolbar
// ============================================================================

function Toolbar({
  editor,
  uploading,
  onPickImage,
}: {
  editor: Editor | null
  uploading: boolean
  onPickImage: () => void
}) {
  if (!editor) return null

  const button =
    "flex h-7 w-7 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40"

  const active = "bg-gray-900 text-white hover:bg-gray-900 hover:text-white"

  const marks = [
    {
      label: "Bold",
      keys: "Ctrl+B",
      Icon: BoldIcon,
      on: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      keys: "Ctrl+I",
      Icon: ItalicIcon,
      on: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      keys: "Ctrl+U",
      Icon: UnderlineIcon,
      on: editor.isActive("underline"),
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
  ]

  const blocks = [
    {
      label: "Heading 2",
      Icon: Heading2,
      on: editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Heading 3",
      Icon: Heading3,
      on: editor.isActive("heading", { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Bulleted list",
      Icon: List,
      on: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      Icon: ListOrdered,
      on: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      Icon: Quote,
      on: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Divider",
      Icon: Minus,
      on: false,
      run: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ]

  function toggleLink() {
    if (editor!.isActive("link")) {
      editor!.chain().focus().unsetLink().run()
      return
    }

    // `prompt` rather than a popover: it is the one control that needs
    // free text, and a custom one here would be a dialog inside a
    // dialog on the pages that edit in place.
    const href = window.prompt("Link address")

    if (!href) return

    editor!.chain().focus().setLink({ href }).run()
  }

  return (
    <div
      role="toolbar"
      aria-label="Mise en forme"
      className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5"
    >
      {marks.map(({ label, keys, Icon, on, run }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          aria-pressed={on}
          aria-label={`${label} (${keys})`}
          title={`${label} · ${keys}`}
          className={`${button} ${on ? active : ""}`}
        >
          <Icon size={15} aria-hidden />
        </button>
      ))}

      <Divider />

      {blocks.map(({ label, Icon, on, run }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          aria-pressed={on}
          aria-label={label}
          title={label}
          className={`${button} ${on ? active : ""}`}
        >
          <Icon size={15} aria-hidden />
        </button>
      ))}

      <Divider />

      <button
        type="button"
        onClick={toggleLink}
        aria-pressed={editor.isActive("link")}
        aria-label={editor.isActive("link") ? "Remove link" : "Add link"}
        title={editor.isActive("link") ? "Remove link" : "Add link"}
        className={`${button} ${editor.isActive("link") ? active : ""}`}
      >
        {editor.isActive("link") ? (
          <Link2Off size={15} aria-hidden />
        ) : (
          <Link2 size={15} aria-hidden />
        )}
      </button>

      <button
        type="button"
        onClick={onPickImage}
        disabled={uploading}
        aria-label="Insert image"
        title="Insert image"
        className={button}
      >
        {uploading ? (
          <Loader2 size={15} className="animate-spin" aria-hidden />
        ) : (
          <ImageIcon size={15} aria-hidden />
        )}
      </button>

      <Divider />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
        title="Undo"
        className={button}
      >
        <Undo2 size={15} aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
        title="Redo"
        className={button}
      >
        <Redo2 size={15} aria-hidden />
      </button>
    </div>
  )
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-gray-300" aria-hidden />
}
