import { parseHighlightedText } from "@/lib/highlight-parser";

interface HighlightedTextProps {
  text: string;
  className?: string;
}

export function HighlightedText({ text, className = "" }: HighlightedTextProps) {
  const segments = parseHighlightedText(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "highlight") {
          return (
            <span
              key={index}
              className="px-1 py-0.5 rounded-sm font-medium"
              style={{
                backgroundColor: segment.bgColor,
                color: segment.textColor,
              }}
            >
              {segment.content}
            </span>
          );
        }
        return <span key={index}>{segment.content}</span>;
      })}
    </span>
  );
}
