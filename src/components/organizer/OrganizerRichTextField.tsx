"use client";

import RichTextEditor from "@/components/editor/RichTextEditor";

interface OrganizerRichTextFieldProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  rows?: number;
  placeholder?: string;
}

export default function OrganizerRichTextField({
  id,
  value,
  onChange,
  maxLength,
  rows = 10,
  placeholder,
}: OrganizerRichTextFieldProps) {
  return (
    <RichTextEditor
      id={id}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      placeholder={placeholder}
      minHeight={rows * 24}
      toolbar="full"
    />
  );
}
