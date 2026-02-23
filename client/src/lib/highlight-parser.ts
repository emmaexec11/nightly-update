const HIGHLIGHT_COLORS: Record<string, { bg: string; text: string }> = {
  yellow: { bg: "#fef3c7", text: "#92400e" },
  green: { bg: "#d1fae5", text: "#065f46" },
  blue: { bg: "#dbeafe", text: "#1e40af" },
  purple: { bg: "#ede9fe", text: "#5b21b6" },
  pink: { bg: "#fce7f3", text: "#9d174d" },
  orange: { bg: "#ffedd5", text: "#c2410c" },
  red: { bg: "#fee2e2", text: "#b91c1c" },
  cyan: { bg: "#cffafe", text: "#0e7490" },
  gray: { bg: "#f3f4f6", text: "#374151" },
};

export type HighlightSegment = {
  type: "text" | "highlight";
  content: string;
  color?: string;
  bgColor?: string;
  textColor?: string;
};

export function parseHighlightedText(text: string): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  const regex = /\[(\w+)\](.*?)\[\/\1\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const colorName = match[1].toLowerCase();
    const colors = HIGHLIGHT_COLORS[colorName];

    segments.push({
      type: "highlight",
      content: match[2],
      color: colorName,
      bgColor: colors?.bg || "#fef3c7",
      textColor: colors?.text || "#92400e",
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

export function wrapTextWithHighlight(text: string, start: number, end: number, color: string): string {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);
  return `${before}[${color}]${selected}[/${color}]${after}`;
}

export function getAvailableColors() {
  return Object.entries(HIGHLIGHT_COLORS).map(([name, colors]) => ({
    name,
    ...colors,
  }));
}
