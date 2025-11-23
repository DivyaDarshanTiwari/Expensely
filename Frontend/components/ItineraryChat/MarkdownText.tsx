import React from "react";
import { Text, StyleSheet, Linking } from "react-native";

interface MarkdownTextProps {
  text: string;
  style?: any;
}

/**
 * Simple markdown renderer for chat messages
 * Supports: **bold**, *italic*, lists, links
 */
export default function MarkdownText({ text, style }: MarkdownTextProps) {
  // Parse markdown and convert to React Native Text components
  const parseMarkdown = (input: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    // Pattern for **bold**
    const boldPattern = /\*\*(.+?)\*\*/g;
    // Pattern for *italic*
    const italicPattern = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
    // Pattern for links [text](url)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Pattern for bullet points
    const bulletPattern = /^[\*\-\+]\s+(.+)$/gm;
    // Pattern for numbered lists
    const numberedPattern = /^\d+\.\s+(.+)$/gm;

    // First, handle links
    let processedText = input;
    const linkMatches: Array<{ start: number; end: number; text: string; url: string }> = [];
    let linkMatch;
    while ((linkMatch = linkPattern.exec(input)) !== null) {
      linkMatches.push({
        start: linkMatch.index,
        end: linkMatch.index + linkMatch[0].length,
        text: linkMatch[1],
        url: linkMatch[2],
      });
    }

    // Process text with all markdown patterns
    const segments: Array<{ text: string; bold?: boolean; italic?: boolean; link?: string }> = [];
    let lastIndex = 0;

    // Find all bold matches
    const boldMatches: Array<{ start: number; end: number; text: string }> = [];
    let boldMatch;
    while ((boldMatch = boldPattern.exec(input)) !== null) {
      boldMatches.push({
        start: boldMatch.index,
        end: boldMatch.index + boldMatch[0].length,
        text: boldMatch[1],
      });
    }

    // Find all italic matches (not part of bold)
    const italicMatches: Array<{ start: number; end: number; text: string }> = [];
    let italicMatch;
    while ((italicMatch = italicPattern.exec(input)) !== null) {
      // Check if this italic is not part of a bold match
      const isPartOfBold = boldMatches.some(
        (bm) => italicMatch.index >= bm.start && italicMatch.index < bm.end
      );
      if (!isPartOfBold) {
        italicMatches.push({
          start: italicMatch.index,
          end: italicMatch.index + italicMatch[0].length,
          text: italicMatch[1],
        });
      }
    }

    // Combine all matches and sort by position
    const allMatches: Array<{
      start: number;
      end: number;
      text: string;
      type: "bold" | "italic" | "link";
      url?: string;
    }> = [
      ...boldMatches.map((m) => ({ ...m, type: "bold" as const })),
      ...italicMatches.map((m) => ({ ...m, type: "italic" as const })),
      ...linkMatches.map((m) => ({ ...m, type: "link" as const, url: m.url })),
    ].sort((a, b) => a.start - b.start);

    // Build segments
    for (const match of allMatches) {
      if (match.start > lastIndex) {
        segments.push({ text: input.substring(lastIndex, match.start) });
      }
      segments.push({
        text: match.text,
        bold: match.type === "bold",
        italic: match.type === "italic",
        link: match.url,
      });
      lastIndex = match.end;
    }

    if (lastIndex < input.length) {
      segments.push({ text: input.substring(lastIndex) });
    }

    // If no matches, return plain text
    if (segments.length === 0) {
      segments.push({ text: input });
    }

    // Render segments
    return segments.map((segment, index) => {
      if (segment.link) {
        return (
          <Text
            key={index}
            style={[styles.link, style]}
            onPress={() => Linking.openURL(segment.link!)}
          >
            {segment.text}
          </Text>
        );
      }
      return (
        <Text
          key={index}
          style={[
            style,
            segment.bold && styles.bold,
            segment.italic && styles.italic,
          ]}
        >
          {segment.text}
        </Text>
      );
    });
  };

  // Handle line breaks and lists
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    // Check for bullet points
    const bulletMatch = line.match(/^[\*\-\+]\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <Text key={`line-${lineIndex}`} style={[style, styles.listItem]}>
          {"\u2022 "}
          {parseMarkdown(bulletMatch[1])}
        </Text>
      );
      return;
    }

    // Check for numbered lists
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      const number = line.match(/^(\d+)\./)?.[1] || "";
      elements.push(
        <Text key={`line-${lineIndex}`} style={[style, styles.listItem]}>
          {number}. {parseMarkdown(numberedMatch[1])}
        </Text>
      );
      return;
    }

    // Regular line
    if (line.trim()) {
      elements.push(
        <Text key={`line-${lineIndex}`} style={style}>
          {parseMarkdown(line)}
        </Text>
      );
    } else {
      // Empty line for spacing
      elements.push(<Text key={`line-${lineIndex}`}>{"\n"}</Text>);
    }
  });

  return <Text style={style}>{elements}</Text>;
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  link: {
    color: "#7C3AED",
    textDecorationLine: "underline",
  },
  listItem: {
    marginVertical: 2,
    paddingLeft: 8,
  },
});

