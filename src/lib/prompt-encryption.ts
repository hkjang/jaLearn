/**
 * 프롬프트 암호화 유틸리티
 * 
 * AES-256 암호화로 프롬프트 콘텐츠 보호
 * 서버사이드에서만 복호화 가능
 */

import crypto from 'crypto';

// 환경변수에서 암호화 키 로드 (32바이트 = 256비트)
const ENCRYPTION_KEY = process.env.PROMPT_ENCRYPTION_KEY || 'default-key-must-be-changed-now!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * 프롬프트 콘텐츠 암호화
 */
export function encryptPrompt(content: string): string {
  if (!content) return '';
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // IV + AuthTag + Encrypted Data 결합
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * 프롬프트 콘텐츠 복호화
 */
export function decryptPrompt(encryptedContent: string): string {
  if (!encryptedContent) return '';
  
  try {
    const parts = encryptedContent.split(':');
    if (parts.length !== 3) {
      // 암호화되지 않은 레거시 데이터
      return encryptedContent;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Prompt decryption failed:', error);
    // 복호화 실패 시 빈 문자열 반환 (보안)
    return '';
  }
}

/**
 * 프롬프트 콘텐츠 해시 생성 (무결성 검증)
 */
export function hashPrompt(content: string): string {
  if (!content) return '';
  
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * 프롬프트 해시 검증
 */
export function verifyPromptHash(content: string, hash: string): boolean {
  if (!content || !hash) return false;
  
  const computedHash = hashPrompt(content);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  );
}

/**
 * 마스킹된 로그용 프롬프트 생성
 * 프롬프트 내용을 완전히 숨기고 메타데이터만 반환
 */
export function maskPromptForLog(prompt: string): string {
  if (!prompt) return '[EMPTY]';
  
  const length = prompt.length;
  const hash = hashPrompt(prompt).slice(0, 8);
  
  return `[MASKED:${length}chars:${hash}]`;
}

/**
 * API 응답에서 프롬프트 제거
 */
export function sanitizeResponseForClient<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: string[] = ['content', 'systemPrompt', 'prompt', 'outcomeIntent', 'trapPoints', 'scoringRules']
): T {
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }
  
  return sanitized;
}

/**
 * 암호화된 필드를 포함한 객체 생성
 */
export function preparePromptForStorage(content: string): {
  content: string;
  contentHash: string;
} {
  return {
    content: encryptPrompt(content),
    contentHash: hashPrompt(content),
  };
}

/**
 * 저장된 프롬프트 복호화 및 검증
 */
export function retrievePromptFromStorage(
  encryptedContent: string,
  storedHash?: string
): { content: string; isValid: boolean } {
  const content = decryptPrompt(encryptedContent);
  
  let isValid = true;
  if (storedHash && content) {
    isValid = verifyPromptHash(content, storedHash);
  }
  
  return { content, isValid };
}
