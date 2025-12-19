/**
 * Document Parser Utility
 * Extracts text from PDF and DOCX files, then parses problems
 */

export interface ParsedProblem {
  content: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY' | 'TRUE_FALSE';
  rawText: string;
}

export interface ParseResult {
  success: boolean;
  problems: ParsedProblem[];
  rawText: string;
  errors: string[];
}

/**
 * Problem pattern matchers for Korean educational content
 */
const PROBLEM_PATTERNS = {
  // 문제 번호 패턴: "1.", "1)", "[1]", "문1.", "문제 1" 등
  problemStart: /(?:^|\n)\s*(?:문제?\s*)?(?:\[?\d+\]?[\.\)\:]\s*|【\d+】)/gm,
  
  // 선택지 패턴: "① ② ③ ④ ⑤" or "A. B. C. D." or "가. 나. 다. 라."
  circledOptions: /([①②③④⑤])\s*([^\n①②③④⑤]+)/g,
  alphaOptions: /([A-E][\.\)])\s*([^\n]+)/g,
  koreanOptions: /([가나다라마][\.\)])\s*([^\n]+)/g,
  
  // 정답 패턴
  answerPatterns: [
    /정답\s*[:\：]\s*([①②③④⑤\dA-E가-마]+)/i,
    /답\s*[:\：]\s*([①②③④⑤\dA-E가-마]+)/i,
    /Answer\s*[:\：]\s*([①②③④⑤\dA-E가-마]+)/i,
  ],
  
  // 해설 패턴
  explanationPatterns: [
    /해설\s*[:\：]\s*([\s\S]*?)(?=(?:문제?\s*)?(?:\[?\d+\]?[\.\)\:])|$)/i,
    /풀이\s*[:\：]\s*([\s\S]*?)(?=(?:문제?\s*)?(?:\[?\d+\]?[\.\)\:])|$)/i,
  ],
};

/**
 * Parse raw text to extract structured problems
 */
export function parseProblemsFromText(text: string): ParseResult {
  const problems: ParsedProblem[] = [];
  const errors: string[] = [];
  
  // Normalize text
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .trim();
  
  // Split by problem numbers
  const problemTexts = splitIntoProblems(normalizedText);
  
  for (const problemText of problemTexts) {
    try {
      const parsed = parseSingleProblem(problemText);
      if (parsed) {
        problems.push(parsed);
      }
    } catch (error) {
      errors.push(`Failed to parse: ${problemText.substring(0, 50)}...`);
    }
  }
  
  return {
    success: problems.length > 0,
    problems,
    rawText: normalizedText,
    errors,
  };
}

/**
 * Split text into individual problem blocks
 */
function splitIntoProblems(text: string): string[] {
  const matches = text.split(PROBLEM_PATTERNS.problemStart);
  return matches
    .map(m => m.trim())
    .filter(m => m.length > 10); // Filter out empty or too short
}

/**
 * Parse a single problem text block
 */
function parseSingleProblem(text: string): ParsedProblem | null {
  if (text.length < 10) return null;
  
  // Detect options
  const options = extractOptions(text);
  
  // Detect answer
  const answer = extractAnswer(text);
  
  // Detect explanation
  const explanation = extractExplanation(text);
  
  // Clean content (remove options, answer, explanation from main text)
  const content = cleanContent(text, options, answer, explanation);
  
  // Detect type
  const type = detectProblemType(text, options);
  
  return {
    content,
    options: options.length > 0 ? options : undefined,
    answer: answer || undefined,
    explanation: explanation || undefined,
    type,
    rawText: text,
  };
}

/**
 * Extract options from problem text
 */
function extractOptions(text: string): string[] {
  const options: string[] = [];
  
  // Try circled options first (most common in Korean tests)
  let match;
  const circledRegex = /([①②③④⑤])\s*([^\n①②③④⑤]+)/g;
  while ((match = circledRegex.exec(text)) !== null) {
    options.push(match[2].trim());
  }
  
  if (options.length > 0) return options;
  
  // Try alphabetic options
  const alphaRegex = /\b([A-E])[\.\)]\s*([^\n]+)/g;
  while ((match = alphaRegex.exec(text)) !== null) {
    options.push(match[2].trim());
  }
  
  if (options.length > 0) return options;
  
  // Try Korean options
  const koreanRegex = /([가나다라마])[\.\)]\s*([^\n]+)/g;
  while ((match = koreanRegex.exec(text)) !== null) {
    options.push(match[2].trim());
  }
  
  return options;
}

/**
 * Extract answer from problem text
 */
function extractAnswer(text: string): string | null {
  for (const pattern of PROBLEM_PATTERNS.answerPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract explanation from problem text
 */
function extractExplanation(text: string): string | null {
  for (const pattern of PROBLEM_PATTERNS.explanationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Clean content by removing options, answer, explanation markers
 */
function cleanContent(
  text: string,
  options: string[],
  answer: string | null,
  explanation: string | null
): string {
  let content = text;
  
  // Remove options section
  if (options.length > 0) {
    content = content.replace(/[①②③④⑤][^\n①②③④⑤]+/g, '');
    content = content.replace(/\b[A-E][\.\)][^\n]+/g, '');
    content = content.replace(/[가나다라마][\.\)][^\n]+/g, '');
  }
  
  // Remove answer section
  if (answer) {
    content = content.replace(/정답\s*[:\：]\s*[^\n]+/gi, '');
    content = content.replace(/답\s*[:\：]\s*[^\n]+/gi, '');
  }
  
  // Remove explanation section
  if (explanation) {
    content = content.replace(/해설\s*[:\：][\s\S]*$/i, '');
    content = content.replace(/풀이\s*[:\：][\s\S]*$/i, '');
  }
  
  // Clean up whitespace
  content = content.replace(/\n{3,}/g, '\n\n').trim();
  
  return content;
}

/**
 * Detect problem type based on content and options
 */
function detectProblemType(
  text: string,
  options: string[]
): ParsedProblem['type'] {
  // Check for true/false keywords
  const tfKeywords = ['O/X', 'O, X', '참/거짓', '맞으면', '틀리면'];
  if (tfKeywords.some(kw => text.includes(kw))) {
    return 'TRUE_FALSE';
  }
  
  // Check for essay keywords
  const essayKeywords = ['서술하시오', '설명하시오', '논술', '기술하시오', '작성하시오'];
  if (essayKeywords.some(kw => text.includes(kw))) {
    return 'ESSAY';
  }
  
  // If options exist, it's multiple choice
  if (options.length >= 2) {
    return 'MULTIPLE_CHOICE';
  }
  
  // Default to short answer
  return 'SHORT_ANSWER';
}

/**
 * Simple text extraction from base64 encoded content
 * Note: For production, you'd use proper libraries like pdf-parse, mammoth
 */
export async function extractTextFromFile(
  base64Content: string,
  mimeType: string
): Promise<{ text: string; error?: string }> {
  try {
    // For text files
    if (mimeType === 'text/plain') {
      const text = Buffer.from(base64Content, 'base64').toString('utf-8');
      return { text };
    }
    
    // For other types, we return the raw content with a note
    // In production, you'd integrate pdf-parse for PDF and mammoth for DOCX
    return {
      text: '',
      error: `File type ${mimeType} requires server-side parsing library. Please copy-paste text content directly or upload a text file.`,
    };
  } catch (error) {
    return {
      text: '',
      error: `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate and clean extracted problems
 */
export function validateProblems(problems: ParsedProblem[]): {
  valid: ParsedProblem[];
  invalid: { problem: ParsedProblem; reason: string }[];
} {
  const valid: ParsedProblem[] = [];
  const invalid: { problem: ParsedProblem; reason: string }[] = [];
  
  for (const problem of problems) {
    const issues: string[] = [];
    
    // Check content length
    if (problem.content.length < 10) {
      issues.push('Content too short');
    }
    
    // Check for multiple choice consistency
    if (problem.type === 'MULTIPLE_CHOICE') {
      if (!problem.options || problem.options.length < 2) {
        issues.push('Multiple choice needs at least 2 options');
      }
    }
    
    if (issues.length === 0) {
      valid.push(problem);
    } else {
      invalid.push({ problem, reason: issues.join(', ') });
    }
  }
  
  return { valid, invalid };
}
