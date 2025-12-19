/**
 * PDF Parser
 * Extract text from PDF files
 */

// Note: This uses pdf-parse which needs to be installed: npm install pdf-parse
// For production, consider using pdf2pic for image-based PDFs that need OCR

export interface PdfParseResult {
  success: boolean;
  text: string;
  pages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    creationDate?: Date;
  };
  error?: string;
}

/**
 * Parse PDF buffer to extract text
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<PdfParseResult> {
  try {
    // Dynamic import to handle cases where pdf-parse isn't installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdfParse: ((buffer: Buffer) => Promise<any>) | null = null;
    try {
      const module = await import('pdf-parse');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfParse = (module as any).default || module;
    } catch {
      pdfParse = null;
    }
    
    if (!pdfParse) {
      return {
        success: false,
        text: '',
        pages: 0,
        info: {},
        error: 'pdf-parse 패키지가 설치되지 않았습니다. npm install pdf-parse',
      };
    }

    const data = await pdfParse(buffer);

    return {
      success: true,
      text: data.text,
      pages: data.numpages,
      info: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      pages: 0,
      info: {},
      error: error instanceof Error ? error.message : 'PDF 파싱 오류',
    };
  }
}

/**
 * Clean extracted PDF text
 */
export function cleanPdfText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Fix common OCR issues
    .replace(/\s*\n\s*/g, '\n')
    // Remove page numbers at the end of lines
    .replace(/\s*-\s*\d+\s*-\s*/g, '\n')
    // Fix bullet points
    .replace(/\s*[●•◦]\s*/g, '\n• ')
    // Normalize Korean punctuation
    .replace(/，/g, ',')
    .replace(/．/g, '.')
    .trim();
}

/**
 * Split PDF text into pages (approximate)
 */
export function splitIntoPages(text: string): string[] {
  // Common page break patterns in Korean documents
  const pageBreakPatterns = [
    /\f/g,                          // Form feed
    /\n\s*-\s*\d+\s*-\s*\n/g,       // -1- style page numbers
    /\n\s*\d+\s*\/\s*\d+\s*\n/g,    // 1/10 style page numbers
  ];

  let pages = [text];
  
  for (const pattern of pageBreakPatterns) {
    const newPages: string[] = [];
    for (const page of pages) {
      newPages.push(...page.split(pattern).filter(p => p.trim()));
    }
    if (newPages.length > pages.length) {
      pages = newPages;
    }
  }

  return pages.map(p => p.trim()).filter(p => p.length > 0);
}

/**
 * Check if PDF is image-based (needs OCR)
 */
export function isImageBasedPdf(text: string, pageCount: number): boolean {
  // If text is too short relative to page count, likely image-based
  const avgCharsPerPage = text.length / Math.max(pageCount, 1);
  return avgCharsPerPage < 100;
}
