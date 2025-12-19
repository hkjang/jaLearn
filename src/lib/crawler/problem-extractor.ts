/**
 * Problem Extractor
 * Extract structured problems from raw text (PDF/OCR output)
 */

export interface ExtractedProblem {
  questionNumber: number;
  content: string;
  options: string[];
  answer: string;
  explanation: string;
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY' | 'TRUE_FALSE';
  confidence: number;
}

export interface ExtractionMetadata {
  year?: number;
  month?: number;
  examName?: string;
  subject?: string;
  gradeLevel?: string;
}

export interface ExtractionResult {
  problems: ExtractedProblem[];
  metadata: ExtractionMetadata;
  rawText: string;
  confidence: number;
}

// Korean exam patterns
const EXAM_PATTERNS = {
  // Question number patterns
  questionNumber: [
    /^(\d{1,3})\s*[.．)）]\s*/m,           // 1. or 1) or 1）
    /^\[(\d{1,3})\]\s*/m,                   // [1]
    /^【(\d{1,3})】\s*/m,                   // 【1】
    /^문\s*(\d{1,3})\s*[.．:]\s*/m,         // 문1. or 문1:
    /^제\s*(\d{1,3})\s*문\s*/m,             // 제1문
  ],
  
  // Option patterns
  options: [
    /[①②③④⑤]\s*/g,                        // Circled numbers
    /[ㄱㄴㄷㄹㅁ]\s*[.．)）]\s*/g,          // Korean consonants
    /[가나다라마]\s*[.．)）]\s*/g,          // Korean syllables
    /\([1-5]\)\s*/g,                         // (1), (2)...
    /[A-E]\s*[.．)）]\s*/g,                  // A., B., C.
  ],
  
  // Answer patterns
  answer: [
    /정답\s*[:：]?\s*([①②③④⑤\d]+)/,
    /답\s*[:：]?\s*([①②③④⑤\d]+)/,
    /\[정답\]\s*([①②③④⑤\d]+)/,
  ],
  
  // Explanation patterns
  explanation: [
    /해설\s*[:：]?\s*([\s\S]*?)(?=\d{1,3}\s*[.．)]|$)/,
    /\[해설\]\s*([\s\S]*?)(?=\d{1,3}\s*[.．)]|$)/,
    /풀이\s*[:：]?\s*([\s\S]*?)(?=\d{1,3}\s*[.．)]|$)/,
  ],
};

// Metadata patterns
const METADATA_PATTERNS = {
  year: [
    /(\d{4})\s*학년도/,
    /(\d{4})년\s*(수능|모의|학력)/,
  ],
  month: [
    /(\d{1,2})월\s*(모의|학력)/,
  ],
  examName: [
    /(대학수학능력시험|수능)/,
    /(모의고사|모의평가)/,
    /(학력평가)/,
    /(전국연합|전국모의)/,
    /(중간고사|기말고사)/,
  ],
  subject: [
    /(국어|영어|수학|과학|사회|한국사|제2외국어)/,
    /(물리|화학|생명과학|지구과학)/,
    /(한국지리|세계지리|동아시아사|세계사)/,
    /(생활과윤리|윤리와사상|정치와법|경제)/,
  ],
  gradeLevel: [
    /고\s*(\d)\s*학년/,
    /중\s*(\d)\s*학년/,
    /(고[123])/,
    /(중[123])/,
  ],
};

/**
 * Extract problems from raw text
 */
export function extractProblems(text: string): ExtractionResult {
  const problems: ExtractedProblem[] = [];
  const metadata = extractMetadata(text);
  
  // Split text into problem blocks
  const blocks = splitIntoProblemBlocks(text);
  
  for (const block of blocks) {
    const problem = parseProlemBlock(block);
    if (problem) {
      problems.push(problem);
    }
  }

  // Calculate overall confidence
  const avgConfidence = problems.length > 0
    ? problems.reduce((sum, p) => sum + p.confidence, 0) / problems.length
    : 0;

  return {
    problems,
    metadata,
    rawText: text,
    confidence: Math.round(avgConfidence * 100) / 100,
  };
}

/**
 * Extract metadata from text
 */
export function extractMetadata(text: string): ExtractionMetadata {
  const metadata: ExtractionMetadata = {};
  
  // Extract year
  for (const pattern of METADATA_PATTERNS.year) {
    const match = text.match(pattern);
    if (match) {
      metadata.year = parseInt(match[1]);
      break;
    }
  }
  
  // Extract month
  for (const pattern of METADATA_PATTERNS.month) {
    const match = text.match(pattern);
    if (match) {
      metadata.month = parseInt(match[1]);
      break;
    }
  }
  
  // Extract exam name
  for (const pattern of METADATA_PATTERNS.examName) {
    const match = text.match(pattern);
    if (match) {
      metadata.examName = match[1];
      break;
    }
  }
  
  // Extract subject
  for (const pattern of METADATA_PATTERNS.subject) {
    const match = text.match(pattern);
    if (match) {
      metadata.subject = match[1];
      break;
    }
  }
  
  // Extract grade level
  for (const pattern of METADATA_PATTERNS.gradeLevel) {
    const match = text.match(pattern);
    if (match) {
      metadata.gradeLevel = match[1];
      break;
    }
  }
  
  return metadata;
}

/**
 * Split text into individual problem blocks
 */
function splitIntoProblemBlocks(text: string): string[] {
  const blocks: string[] = [];
  
  // Try multiple splitting strategies
  // Strategy 1: Split by question numbers
  const questionPattern = /(?:^|\n)\s*(\d{1,3})\s*[.．)）]\s*/g;
  const matches = [...text.matchAll(questionPattern)];
  
  if (matches.length >= 2) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!;
      const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
      blocks.push(text.substring(start, end).trim());
    }
  } else {
    // Strategy 2: Split by double newlines
    const parts = text.split(/\n\s*\n/).filter(p => p.trim().length > 30);
    blocks.push(...parts);
  }
  
  return blocks.filter(b => b.length > 20);
}

/**
 * Parse a single problem block
 */
function parseProlemBlock(block: string): ExtractedProblem | null {
  let confidence = 0.5;
  
  // Extract question number
  let questionNumber = 0;
  for (const pattern of EXAM_PATTERNS.questionNumber) {
    const match = block.match(pattern);
    if (match) {
      questionNumber = parseInt(match[1]);
      confidence += 0.1;
      break;
    }
  }
  
  // Detect problem type and extract options
  const options: string[] = [];
  let type: ExtractedProblem['type'] = 'SHORT_ANSWER';
  
  // Check for circled numbers (most common in Korean exams)
  const circledNumbers = ['①', '②', '③', '④', '⑤'];
  const circledMatches = block.match(/[①②③④⑤][^①②③④⑤]*/g);
  
  if (circledMatches && circledMatches.length >= 2) {
    type = 'MULTIPLE_CHOICE';
    confidence += 0.2;
    
    for (const match of circledMatches) {
      const optionText = match.substring(1).trim().replace(/\s+/g, ' ');
      if (optionText.length > 0 && optionText.length < 500) {
        options.push(optionText);
      }
    }
  }
  
  // Check for True/False
  if (block.includes('O/X') || block.includes('참/거짓') || /\(O\)\s*\(X\)/.test(block)) {
    type = 'TRUE_FALSE';
    confidence += 0.1;
  }
  
  // Check for essay markers
  if (block.includes('서술하시오') || block.includes('논술하시오') || block.includes('설명하시오')) {
    type = 'ESSAY';
    confidence += 0.1;
  }
  
  // Extract answer
  let answer = '';
  for (const pattern of EXAM_PATTERNS.answer) {
    const match = block.match(pattern);
    if (match) {
      answer = match[1].trim();
      confidence += 0.15;
      break;
    }
  }
  
  // Extract explanation
  let explanation = '';
  for (const pattern of EXAM_PATTERNS.explanation) {
    const match = block.match(pattern);
    if (match) {
      explanation = match[1].trim().replace(/\s+/g, ' ');
      confidence += 0.1;
      break;
    }
  }
  
  // Extract content (main question text)
  let content = block;
  
  // Remove question number
  for (const pattern of EXAM_PATTERNS.questionNumber) {
    content = content.replace(pattern, '').trim();
  }
  
  // Remove options from content
  if (type === 'MULTIPLE_CHOICE') {
    const firstOption = content.search(/[①②③④⑤]/);
    if (firstOption > 0) {
      content = content.substring(0, firstOption).trim();
    }
  }
  
  // Clean content
  content = content.replace(/\s+/g, ' ').trim();
  
  // Validate
  if (content.length < 10) {
    return null;
  }
  
  return {
    questionNumber,
    content,
    options,
    answer,
    explanation,
    type,
    confidence: Math.min(1, confidence),
  };
}

/**
 * Map circled number to index
 */
export function circledNumberToIndex(char: string): number {
  const map: Record<string, number> = {
    '①': 0, '②': 1, '③': 2, '④': 3, '⑤': 4,
    '⑥': 5, '⑦': 6, '⑧': 7, '⑨': 8, '⑩': 9,
  };
  return map[char] ?? -1;
}

/**
 * Index to circled number
 */
export function indexToCircledNumber(index: number): string {
  const numbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  return numbers[index] ?? String(index + 1);
}
