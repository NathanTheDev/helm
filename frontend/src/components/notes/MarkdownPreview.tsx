"use client";

import ReactMarkdown from "react-markdown";

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div
      className="mt-6 min-h-[16rem] flex-1 text-ink
        [&_h1]:font-display [&_h1]:text-2xl [&_h1]:italic [&_h1]:mt-6 [&_h1]:mb-2
        [&_h2]:font-display [&_h2]:text-xl [&_h2]:mt-5 [&_h2]:mb-2
        [&_h3]:font-display [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-1
        [&_p]:my-3 [&_p]:leading-relaxed
        [&_a]:text-clay [&_a]:underline
        [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5
        [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5
        [&_li]:my-1
        [&_blockquote]:border-l-2 [&_blockquote]:border-clay [&_blockquote]:pl-4 [&_blockquote]:text-ink-muted
        [&_code]:rounded [&_code]:bg-clay-soft/40 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm
        [&_pre]:rounded-xl [&_pre]:bg-surface [&_pre]:border [&_pre]:border-line [&_pre]:p-4 [&_pre]:overflow-x-auto
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
        [&_hr]:border-line"
    >
      {content.trim() ? (
        <ReactMarkdown>{content}</ReactMarkdown>
      ) : (
        <p className="text-ink-muted/60">Nothing to preview yet.</p>
      )}
    </div>
  );
}
