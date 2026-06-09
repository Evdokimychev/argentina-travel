"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  getPlainTextLength,
  htmlToPlainText,
  normalizeEditorValue,
  sanitizeHtml,
} from "@/lib/rich-text";

type RichTextToolbarVariant = "full" | "basic";

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  minHeight?: number;
  toolbar?: RichTextToolbarVariant;
  footer?: React.ReactNode;
  className?: string;
}

export default function RichTextEditor({
  id,
  value,
  onChange,
  maxLength,
  placeholder,
  minHeight = 240,
  toolbar = "full",
  footer,
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef(value);
  const lastValidHtmlRef = useRef(normalizeEditorValue(value));
  const [isEmpty, setIsEmpty] = useState(() => !htmlToPlainText(value).trim());

  const buttonClass =
    "flex h-8 w-8 items-center justify-center rounded-lg text-charcoal transition-colors hover:bg-gray-100";

  const emitChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = sanitizeHtml(editor.innerHTML);
    const plainLength = getPlainTextLength(html);

    if (plainLength > maxLength) {
      editor.innerHTML = lastValidHtmlRef.current;
      return;
    }

    lastValidHtmlRef.current = html;
    lastEmittedRef.current = html;
    onChange(html);
    setIsEmpty(plainLength === 0);
  }, [maxLength, onChange]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (value === lastEmittedRef.current) return;

    const html = normalizeEditorValue(value);
    editor.innerHTML = html;
    lastValidHtmlRef.current = html;
    lastEmittedRef.current = value;
    setIsEmpty(!getPlainTextLength(html));
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = normalizeEditorValue(value);
    editor.innerHTML = html;
    lastValidHtmlRef.current = html;
    setIsEmpty(!getPlainTextLength(html));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runCommand(command: string, commandValue?: string) {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function insertLink() {
    const url = window.prompt("Введите ссылку", "https://");
    if (!url?.trim()) return;
    runCommand("createLink", url.trim());
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    emitChange();
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-gray-200 bg-white", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1.5">
        <button type="button" className={buttonClass} onClick={() => runCommand("bold")} aria-label="Жирный">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={buttonClass} onClick={() => runCommand("italic")} aria-label="Курсив">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={buttonClass} onClick={() => runCommand("underline")} aria-label="Подчёркнутый">
          <Underline className="h-4 w-4" />
        </button>

        {toolbar === "full" ? (
          <>
            <button type="button" className={buttonClass} onClick={insertLink} aria-label="Ссылка">
              <Link2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => runCommand("insertUnorderedList")}
              aria-label="Маркированный список"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => runCommand("insertOrderedList")}
              aria-label="Нумерованный список"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </>
        ) : null}

        <button
          type="button"
          className={buttonClass}
          onClick={() => runCommand("removeFormat")}
          aria-label="Очистить формат"
        >
          <RemoveFormatting className="h-4 w-4" />
        </button>

        {toolbar === "full" ? (
          <>
            <button
              type="button"
              className={buttonClass}
              onClick={() => runCommand("formatBlock", "blockquote")}
              aria-label="Цитата"
            >
              <Quote className="h-4 w-4" />
            </button>
            <span className="mx-1 h-5 w-px bg-gray-200" />
            <button type="button" className={buttonClass} onClick={() => runCommand("justifyLeft")} aria-label="Выравнивание слева">
              <AlignLeft className="h-4 w-4" />
            </button>
            <button type="button" className={buttonClass} onClick={() => runCommand("justifyCenter")} aria-label="Выравнивание по центру">
              <AlignCenter className="h-4 w-4" />
            </button>
          </>
        ) : null}

        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" className={buttonClass} onClick={() => runCommand("undo")} aria-label="Отменить">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" className={buttonClass} onClick={() => runCommand("redo")} aria-label="Повторить">
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        {isEmpty && placeholder ? (
          <div className="pointer-events-none absolute left-4 top-3 text-sm text-slate">{placeholder}</div>
        ) : null}
        <div
          ref={editorRef}
          id={id}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={handlePaste}
          className="rich-text-editor-content min-w-0 px-4 py-3 text-sm leading-relaxed text-charcoal outline-none"
          style={{ minHeight }}
        />
      </div>

      {footer ? <div className="border-t border-gray-200 px-4 py-2">{footer}</div> : null}
    </div>
  );
}
