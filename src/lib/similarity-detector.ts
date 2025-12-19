/**
 * Enhanced Similarity Detection
 * Implements semantic similarity, formula comparison, and numeric substitution detection
 */

// ==============================
// Text Similarity Functions
// ==============================

/**
 * Tokenize Korean/English text for comparison
 */
export function tokenize(text: string): string[] {
  // Normalize
  const normalized = text
    .toLowerCase()
    .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣0-9\s]/g, ' ')
    .trim();
  
  // Split into words
  return normalized
    .split(/\s+/)
    .filter(w => w.length > 1);
}

/**
 * Calculate Jaccard similarity between two token sets
 */
export function jaccardSimilarity(tokens1: string[], tokens2: string[]): number {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Calculate cosine similarity using TF-IDF-like approach
 */
export function cosineSimilarity(tokens1: string[], tokens2: string[]): number {
  // Build vocabulary
  const allTokens = [...new Set([...tokens1, ...tokens2])];
  
  // Build frequency vectors
  const freq1: Record<string, number> = {};
  const freq2: Record<string, number> = {};
  
  tokens1.forEach(t => freq1[t] = (freq1[t] || 0) + 1);
  tokens2.forEach(t => freq2[t] = (freq2[t] || 0) + 1);
  
  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  allTokens.forEach(t => {
    const v1 = freq1[t] || 0;
    const v2 = freq2[t] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

/**
 * Calculate Levenshtein distance for edit similarity
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate normalized edit distance similarity
 */
export function editSimilarity(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(s1, s2) / maxLen;
}

// ==============================
// Formula Comparison
// ==============================

/**
 * Extract mathematical formulas from text
 */
export function extractFormulas(text: string): string[] {
  const formulas: string[] = [];
  
  // LaTeX style: $...$
  const latexMatches = text.match(/\$[^$]+\$/g) || [];
  formulas.push(...latexMatches);
  
  // Simple expressions: x = ..., f(x) = ...
  const exprMatches = text.match(/[a-zA-Z]\s*\([^)]*\)\s*=\s*[^\n,]+/g) || [];
  formulas.push(...exprMatches);
  
  // Equations with operators
  const eqMatches = text.match(/\d+\s*[+\-×÷*/]\s*\d+\s*=\s*\d+/g) || [];
  formulas.push(...eqMatches);
  
  return formulas;
}

/**
 * Normalize formula for comparison
 */
export function normalizeFormula(formula: string): string {
  return formula
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[a-z]/gi, 'x') // Normalize variables
    .replace(/\d+/g, 'N') // Normalize numbers
    .toLowerCase();
}

/**
 * Compare formula structures
 */
export function compareFormulaStructure(formula1: string, formula2: string): number {
  const norm1 = normalizeFormula(formula1);
  const norm2 = normalizeFormula(formula2);
  
  return editSimilarity(norm1, norm2);
}

/**
 * Calculate formula similarity between two texts
 */
export function formulaSimilarity(text1: string, text2: string): number {
  const formulas1 = extractFormulas(text1);
  const formulas2 = extractFormulas(text2);
  
  if (formulas1.length === 0 && formulas2.length === 0) {
    return 0; // No formulas to compare
  }
  
  if (formulas1.length === 0 || formulas2.length === 0) {
    return 0; // One has formulas, other doesn't
  }
  
  // Calculate best match for each formula
  let totalSim = 0;
  const matches = Math.min(formulas1.length, formulas2.length);
  
  for (const f1 of formulas1.slice(0, matches)) {
    let maxSim = 0;
    for (const f2 of formulas2) {
      const sim = compareFormulaStructure(f1, f2);
      maxSim = Math.max(maxSim, sim);
    }
    totalSim += maxSim;
  }
  
  return totalSim / matches;
}

// ==============================
// Numeric Substitution Detection
// ==============================

/**
 * Extract numbers from text
 */
export function extractNumbers(text: string): number[] {
  const matches = text.match(/-?\d+\.?\d*/g) || [];
  return matches.map(m => parseFloat(m)).filter(n => !isNaN(n));
}

/**
 * Check if two texts differ only in numbers
 */
export function detectNumericSubstitution(text1: string, text2: string): {
  isVariant: boolean;
  changedNumbers: { original: number; changed: number }[];
  confidence: number;
} {
  // Remove all numbers and compare
  const stripped1 = text1.replace(/-?\d+\.?\d*/g, '___NUM___');
  const stripped2 = text2.replace(/-?\d+\.?\d*/g, '___NUM___');
  
  // Check if non-numeric parts are similar
  const strippedSimilarity = editSimilarity(stripped1, stripped2);
  
  if (strippedSimilarity < 0.9) {
    return { isVariant: false, changedNumbers: [], confidence: 0 };
  }
  
  // Extract and compare numbers
  const nums1 = extractNumbers(text1);
  const nums2 = extractNumbers(text2);
  
  if (nums1.length !== nums2.length) {
    return { isVariant: false, changedNumbers: [], confidence: 0 };
  }
  
  const changedNumbers: { original: number; changed: number }[] = [];
  let sameCount = 0;
  
  for (let i = 0; i < nums1.length; i++) {
    if (nums1[i] !== nums2[i]) {
      changedNumbers.push({ original: nums1[i], changed: nums2[i] });
    } else {
      sameCount++;
    }
  }
  
  // At least some numbers should be different for it to be a variant
  const isVariant = changedNumbers.length > 0 && changedNumbers.length <= nums1.length * 0.5;
  const confidence = isVariant ? strippedSimilarity * (sameCount / nums1.length + 0.5) : 0;
  
  return { isVariant, changedNumbers, confidence: Math.min(1, confidence) };
}

// ==============================
// Comprehensive Similarity
// ==============================

export interface SimilarityResult {
  textSimilarity: number;       // Jaccard text similarity
  semanticSimilarity: number;   // Cosine similarity (pseudo-semantic)
  formulaSimilarity: number;    // Formula structure similarity
  numericSubstitution: {
    isVariant: boolean;
    confidence: number;
  };
  overallSimilarity: number;    // Weighted overall
  isDuplicate: boolean;         // Above threshold
  isVariant: boolean;           // Numeric/minor variant
}

/**
 * Calculate comprehensive similarity between two problem texts
 */
export function calculateComprehensiveSimilarity(
  text1: string,
  text2: string,
  options: {
    duplicateThreshold?: number;
    variantThreshold?: number;
  } = {}
): SimilarityResult {
  const { duplicateThreshold = 0.85, variantThreshold = 0.7 } = options;
  
  // Text similarities
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);
  
  const textSimilarity = jaccardSimilarity(tokens1, tokens2);
  const semanticSimilarity = cosineSimilarity(tokens1, tokens2);
  
  // Formula similarity
  const formulaSim = formulaSimilarity(text1, text2);
  
  // Numeric substitution check
  const numSubst = detectNumericSubstitution(text1, text2);
  
  // Calculate overall similarity with weights
  const weights = {
    text: 0.4,
    semantic: 0.3,
    formula: 0.2,
    numSubst: 0.1,
  };
  
  const overallSimilarity = 
    textSimilarity * weights.text +
    semanticSimilarity * weights.semantic +
    formulaSim * weights.formula +
    (numSubst.isVariant ? numSubst.confidence * weights.numSubst : 0);
  
  return {
    textSimilarity: Math.round(textSimilarity * 100) / 100,
    semanticSimilarity: Math.round(semanticSimilarity * 100) / 100,
    formulaSimilarity: Math.round(formulaSim * 100) / 100,
    numericSubstitution: {
      isVariant: numSubst.isVariant,
      confidence: Math.round(numSubst.confidence * 100) / 100,
    },
    overallSimilarity: Math.round(overallSimilarity * 100) / 100,
    isDuplicate: overallSimilarity >= duplicateThreshold,
    isVariant: numSubst.isVariant || (overallSimilarity >= variantThreshold && overallSimilarity < duplicateThreshold),
  };
}

/**
 * Find similar problems from a list
 */
export function findSimilarProblems(
  targetContent: string,
  problems: { id: string; content: string }[],
  threshold = 0.5
): {
  id: string;
  similarity: SimilarityResult;
}[] {
  const results: { id: string; similarity: SimilarityResult }[] = [];
  
  for (const problem of problems) {
    const similarity = calculateComprehensiveSimilarity(targetContent, problem.content);
    
    if (similarity.overallSimilarity >= threshold) {
      results.push({
        id: problem.id,
        similarity,
      });
    }
  }
  
  return results.sort((a, b) => b.similarity.overallSimilarity - a.similarity.overallSimilarity);
}
