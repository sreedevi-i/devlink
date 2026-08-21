import { useId, useRef, useState } from "react";
import {
  Eye,
  Pencil,
  Image as ImageIcon,
  Video,
  AtSign,
  Code2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading,
  Link as LinkIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Markdown } from "@/components/shared/Markdown";
import { Avatar } from "@/components/shared/primitives";
import { builders } from "@/mocks/seed";
import { cn } from "@/lib/utils";
import { TypoCaption } from "@/components/shared/Typography";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  textareaClassName?: string;
  autoFocus?: boolean;
}

/**
 * Inserts `text` at the current cursor position (replacing any selection),
 * rather than always appending to the end. Returns the new full value and
 * the cursor offset where the caret should land afterward.
 */
function insertAtCursor(
  current: string,
  selectionStart: number,
  selectionEnd: number,
  insertion: string,
  cursorOffsetFromStart = insertion.length,
): { nextValue: string; nextCursor: number } {
  const before = current.slice(0, selectionStart);
  const after = current.slice(selectionEnd);
  const nextValue = `${before}${insertion}${after}`;
  const nextCursor = selectionStart + cursorOffsetFromStart;
  return { nextValue, nextCursor };
}

/**
 * Wraps the selected text (or inserts a placeholder) with `prefix` and
 * `suffix` markdown markers (e.g. **bold**, _italic_).
 */
function wrapSelection(
  current: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
  placeholder: string,
): { nextValue: string; nextCursor: number; selectionStart: number; selectionEnd: number } {
  const selected = current.slice(selectionStart, selectionEnd) || placeholder;
  const nextValue =
    current.slice(0, selectionStart) + prefix + selected + suffix + current.slice(selectionEnd);
  const newStart = selectionStart + prefix.length;
  const newEnd = newStart + selected.length;
  return { nextValue, nextCursor: newEnd, selectionStart: newStart, selectionEnd: newEnd };
}

/**
 * Write / Preview markdown editor.
 * "Write" is a plain textarea with a lightweight formatting toolbar above it;
 * "Preview" renders the same content through the shared <Markdown> renderer
 * so contributors see exactly what will be published (GFM tables, code
 * blocks, images, lists, headers, etc).
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write some markdown... Use @username to mention someone",
  rows = 4,
  className,
  textareaClassName,
  autoFocus,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const previewId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention dropdown state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionPos, setMentionPos] = useState<{ start: number; end: number } | null>(null);

  // Filter builders based on typed @query
  const filteredUsers =
    mentionQuery !== null
      ? builders
          .filter(
            (b) =>
              b.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
              b.id.toLowerCase().includes(mentionQuery.toLowerCase()),
          )
          .slice(0, 5)
      : [];

  /**
   * Shared entry point for every toolbar button: reads the textarea's
   * current selection, inserts `insertion` there, updates the value via
   * onChange, then restores focus and places the caret at `cursorOffset`.
   */
  const insertAtCursorInTextarea = (insertion: string, cursorOffset?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${insertion}`);
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    const { nextValue, nextCursor } = insertAtCursor(
      value,
      selectionStart,
      selectionEnd,
      insertion,
      cursorOffset ?? insertion.length,
    );

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  /**
   * Wraps the current selection with markdown markers (e.g. **bold**).
   */
  const wrapAtCursor = (prefix: string, suffix: string, placeholderText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${prefix}${placeholderText}${suffix}`);
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    const {
      nextValue,
      selectionStart: newStart,
      selectionEnd: newEnd,
    } = wrapSelection(value, selectionStart, selectionEnd, prefix, suffix, placeholderText);

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    });
  };

  // ── Toolbar handlers ──────────────────────────────────────────────────

  const handleBold = () => wrapAtCursor("**", "**", "bold text");
  const handleItalic = () => wrapAtCursor("_", "_", "italic text");
  const handleHeading = () => insertAtCursorInTextarea("## ", 3);
  const handleQuote = () => insertAtCursorInTextarea("> ", 2);
  const handleUnorderedList = () => insertAtCursorInTextarea("- ", 2);
  const handleOrderedList = () => insertAtCursorInTextarea("1. ", 3);
  const handleLink = () => {
    const snippet = "[link text](url)";
    insertAtCursorInTextarea(snippet, 1);
  };
  const handleCodeBlock = () => {
    const snippet = "```\n\n```";
    insertAtCursorInTextarea(snippet, 4);
  };
  const handleEmoji = () => insertAtCursorInTextarea("\u{1F600}");
  const handleImage = () => insertAtCursorInTextarea("![Alt text](image-url)", 2);
  const handleVideo = () => insertAtCursorInTextarea("[Watch Video](video-url)");
  const handleMention = () => insertAtCursorInTextarea("@username");

  // ── Mention autocomplete ──────────────────────────────────────────────

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(newValue);

    // Look back from current cursor to detect active @mention trigger
    const textBeforeCursor = newValue.slice(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      // Ensure '@' is preceded by a whitespace or at start of line
      if (/\s/.test(charBeforeAt) || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        // Only trigger if no whitespace within the typed mention handle
        if (!/\s/.test(query)) {
          setMentionQuery(query);
          setMentionPos({ start: lastAtIndex, end: cursor });
          setMentionIndex(0);
          return;
        }
      }
    }

    setMentionQuery(null);
    setMentionPos(null);
  };

  const insertMention = (username: string) => {
    if (!mentionPos || !textareaRef.current) return;
    const before = value.slice(0, mentionPos.start);
    const after = value.slice(mentionPos.end);
    const updated = `${before}@${username} ${after}`;
    onChange(updated);

    setMentionQuery(null);
    setMentionPos(null);

    setTimeout(() => {
      if (textareaRef.current) {
        const nextCursor = mentionPos.start + username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex].id);
      } else if (e.key === "Escape") {
        setMentionQuery(null);
        setMentionPos(null);
      }
    }
  };

  // ── Toolbar button helper ─────────────────────────────────────────────

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    label,
    iconSize = 14,
  }: {
    onClick: () => void;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    iconSize?: number;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <Icon size={iconSize} />
    </button>
  );

  const Divider = () => <span className="mx-0.5 h-5 w-px bg-border" />;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className={cn("w-full", className)}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "write" | "preview")}>
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="write" className="gap-1.5">
              <Pencil size={12} /> Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye size={12} /> Preview
            </TabsTrigger>
          </TabsList>
          <TypoCaption as="p">
            Markdown supported - **bold** _italic_ `code` @mention [link](url)
          </TypoCaption>
        </div>

        {/* ── Write tab ─────────────────────────────────────────────── */}
        <TabsContent value="write" className="mt-2">
          {tab === "write" && (
            <div className="mb-1.5 flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-surface p-1">
              <ToolbarButton onClick={handleBold} icon={Bold} label="Bold" />
              <ToolbarButton onClick={handleItalic} icon={Italic} label="Italic" />
              <Divider />
              <ToolbarButton onClick={handleHeading} icon={Heading} label="Heading" />
              <ToolbarButton onClick={handleQuote} icon={Quote} label="Quote" />
              <Divider />
              <ToolbarButton onClick={handleUnorderedList} icon={List} label="Unordered list" />
              <ToolbarButton onClick={handleOrderedList} icon={ListOrdered} label="Ordered list" />
              <Divider />
              <ToolbarButton onClick={handleLink} icon={LinkIcon} label="Link" />
              <ToolbarButton onClick={handleImage} icon={ImageIcon} label="Image" />
              <ToolbarButton onClick={handleVideo} icon={Video} label="Video" />
              <Divider />
              <ToolbarButton onClick={handleCodeBlock} icon={Code2} label="Code block" />
              <ToolbarButton onClick={handleMention} icon={AtSign} label="Mention" />
              <ToolbarButton
                onClick={handleEmoji}
                label="Emoji"
                icon={() => <span className="text-[14px]">{"\u{1F600}"}</span>}
              />
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={rows}
              autoFocus={autoFocus}
              className={cn(
                "w-full resize-y rounded-md border border-border bg-surface p-3 font-mono text-[13px] leading-relaxed text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                textareaClassName,
              )}
            />

            {/* Mention autocomplete dropdown */}
            {mentionQuery !== null && filteredUsers.length > 0 && (
              <div className="absolute left-3 bottom-full mb-1 z-50 w-64 rounded-md border border-border bg-surface shadow-lg py-1 overflow-hidden">
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border flex items-center gap-1">
                  <AtSign size={12} /> Mention User
                </div>
                {filteredUsers.map((user, i) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => insertMention(user.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] transition-colors",
                      i === mentionIndex
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground",
                    )}
                  >
                    <Avatar src={user.avatar} alt={user.name} size={20} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium">{user.name}</p>
                      <TypoCaption as="p">@{user.id}</TypoCaption>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Preview tab ──────────────────────────────────────────── */}
        <TabsContent value="preview" className="mt-2">
          <div
            id={previewId}
            className="rounded-md border border-dashed border-border bg-surface p-3"
            style={{ minHeight: `${rows * 1.6}em` }}
          >
            {value.trim() ? (
              <Markdown content={value} />
            ) : (
              <TypoCaption as="p">Nothing to preview yet.</TypoCaption>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
