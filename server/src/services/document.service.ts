import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DocumentChunk {
  text: string;
  source: string;
  chunkIndex: number;
  section: string;
  charCount: number;
}

const DEFAULT_FILE_NAME = "edureach-knowledge.txt";
const DEFAULT_FILE_PATH = path.join(__dirname, "../../knowledge-base", DEFAULT_FILE_NAME);

/**
 * Parses edureach-knowledge.txt into section-aware, semantically cohesive chunks.
 * Preserves section headers, paragraph boundaries, and avoids mid-sentence splits.
 */
export const loadAndChunkKnowledgeBase = async (
  filePath: string = DEFAULT_FILE_PATH,
  sourceName: string = DEFAULT_FILE_NAME
): Promise<DocumentChunk[]> => {
  const content = await fs.readFile(filePath, "utf-8");
  return chunkKnowledgeText(content, sourceName);
};

export const chunkKnowledgeText = (
  rawText: string,
  sourceName: string = DEFAULT_FILE_NAME
): DocumentChunk[] => {
  const lines = rawText.split(/\r?\n/);
  const sections: { sectionName: string; lines: string[] }[] = [];

  let currentSection = "";
  let currentLines: string[] = [];

  // Known section headers or ALL-CAPS lines
  const isSectionHeader = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^[A-Z0-9\s—–-]{3,40}$/.test(trimmed) && !trimmed.endsWith(".")) {
      return true;
    }
    return false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (isSectionHeader(trimmed)) {
      if (currentLines.length > 0 && currentSection) {
        sections.push({ sectionName: currentSection, lines: [...currentLines] });
        currentLines = [];
      } else if (currentLines.length > 0 && !currentSection) {
        // Preamble or title before the first section header
        // If it's substantive text (>120 chars), preserve it; otherwise skip bare title headers
        const preambleText = currentLines.join(" ").trim();
        if (preambleText.length > 120) {
          sections.push({ sectionName: "General Information", lines: [...currentLines] });
        }
        currentLines = [];
      }
      currentSection = trimmed;
    } else if (trimmed) {
      currentLines.push(trimmed);
    }
  }

  if (currentLines.length > 0 && currentSection) {
    sections.push({ sectionName: currentSection, lines: [...currentLines] });
  }

  const chunks: DocumentChunk[] = [];
  let chunkCounter = 0;
  const MAX_CHUNK_CHARS = 1000;

  for (const sec of sections) {
    const sectionBody = sec.lines.join("\n");
    const paragraphs = sectionBody.split(/\n+/).map((p) => p.trim()).filter(Boolean);

    let currentBuffer = "";

    for (const paragraph of paragraphs) {
      // If adding this paragraph keeps chunk under MAX_CHUNK_CHARS, append it
      if (currentBuffer.length + paragraph.length + 1 <= MAX_CHUNK_CHARS) {
        currentBuffer = currentBuffer ? `${currentBuffer}\n${paragraph}` : paragraph;
      } else {
        // Flush existing buffer if non-empty
        if (currentBuffer) {
          const chunkText = `[Section: ${sec.sectionName}]\n${currentBuffer}`;
          chunks.push({
            text: chunkText,
            source: sourceName,
            chunkIndex: chunkCounter++,
            section: sec.sectionName,
            charCount: chunkText.length,
          });
        }

        // If the single paragraph itself is very long (>MAX_CHUNK_CHARS), split by sentences
        if (paragraph.length > MAX_CHUNK_CHARS) {
          const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)/g) || [paragraph];
          let sentBuffer = "";

          for (const sentence of sentences) {
            if (sentBuffer.length + sentence.length <= 800) {
              sentBuffer += sentence;
            } else {
              if (sentBuffer.trim()) {
                const chunkText = `[Section: ${sec.sectionName}]\n${sentBuffer.trim()}`;
                chunks.push({
                  text: chunkText,
                  source: sourceName,
                  chunkIndex: chunkCounter++,
                  section: sec.sectionName,
                  charCount: chunkText.length,
                });
              }
              sentBuffer = sentence;
            }
          }

          currentBuffer = sentBuffer.trim();
        } else {
          currentBuffer = paragraph;
        }
      }
    }

    if (currentBuffer.trim()) {
      const chunkText = `[Section: ${sec.sectionName}]\n${currentBuffer.trim()}`;
      chunks.push({
        text: chunkText,
        source: sourceName,
        chunkIndex: chunkCounter++,
        section: sec.sectionName,
        charCount: chunkText.length,
      });
    }
  }

  return chunks;
};
