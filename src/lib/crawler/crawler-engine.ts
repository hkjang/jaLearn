/**
 * Crawler Engine
 * HTTP crawling, link extraction, and file downloading
 */

import * as cheerio from 'cheerio';

export interface CrawlResult {
  url: string;
  html: string;
  links: string[];
  fileLinks: { url: string; type: string; name: string }[];
  title: string;
  success: boolean;
  error?: string;
}

export interface CrawlOptions {
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  followRedirects?: boolean;
}

const DEFAULT_USER_AGENT = 'JaLearn-Crawler/1.0 (Educational Research)';
const DEFAULT_TIMEOUT = 30000;

/**
 * Fetch a web page and extract content
 */
export async function crawlPage(
  url: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const {
    timeout = DEFAULT_TIMEOUT,
    userAgent = DEFAULT_USER_AGENT,
    headers = {},
  } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        url,
        html: '',
        links: [],
        fileLinks: [],
        title: '',
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text().trim();

    // Extract all links
    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const absoluteUrl = resolveUrl(url, href);
        if (absoluteUrl) links.push(absoluteUrl);
      }
    });

    // Extract file links (PDF, HWP, etc.)
    const fileLinks: { url: string; type: string; name: string }[] = [];
    const fileExtensions = ['pdf', 'hwp', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'];
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const ext = getFileExtension(href);
        if (ext && fileExtensions.includes(ext.toLowerCase())) {
          const absoluteUrl = resolveUrl(url, href);
          const name = $(el).text().trim() || getFileName(href);
          if (absoluteUrl) {
            fileLinks.push({
              url: absoluteUrl,
              type: ext.toLowerCase(),
              name,
            });
          }
        }
      }
    });

    return {
      url,
      html,
      links: [...new Set(links)],
      fileLinks,
      title,
      success: true,
    };
  } catch (error) {
    return {
      url,
      html: '',
      links: [],
      fileLinks: [],
      title: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download a file from URL
 */
export async function downloadFile(
  url: string,
  options: CrawlOptions = {}
): Promise<{ success: boolean; data?: Buffer; size?: number; error?: string }> {
  const {
    timeout = DEFAULT_TIMEOUT,
    userAgent = DEFAULT_USER_AGENT,
    headers = {},
  } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    return {
      success: true,
      data,
      size: data.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract links matching a pattern
 */
export function extractLinksWithPattern(
  html: string,
  pattern: RegExp,
  baseUrl: string
): string[] {
  const $ = cheerio.load(html);
  const matches: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const absoluteUrl = resolveUrl(baseUrl, href);
      if (absoluteUrl && pattern.test(absoluteUrl)) {
        matches.push(absoluteUrl);
      }
    }
  });

  return [...new Set(matches)];
}

/**
 * Extract links using CSS selector
 */
export function extractLinksWithSelector(
  html: string,
  selector: string,
  baseUrl: string
): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  $(selector).each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const absoluteUrl = resolveUrl(baseUrl, href);
      if (absoluteUrl) links.push(absoluteUrl);
    }
  });

  return [...new Set(links)];
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(base: string, relative: string): string | null {
  try {
    // Skip javascript:, mailto:, tel: links
    if (/^(javascript|mailto|tel):/i.test(relative)) {
      return null;
    }
    return new URL(relative, base).href;
  } catch {
    return null;
  }
}

/**
 * Get file extension from URL
 */
function getFileExtension(url: string): string | null {
  try {
    const pathname = new URL(url, 'http://example.com').pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1] : null;
  } catch {
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1] : null;
  }
}

/**
 * Get file name from URL
 */
function getFileName(url: string): string {
  try {
    const pathname = new URL(url, 'http://example.com').pathname;
    const parts = pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'file');
  } catch {
    return 'file';
  }
}

/**
 * Sleep for delay between requests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if URL is same domain
 */
export function isSameDomain(url1: string, url2: string): boolean {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    return u1.hostname === u2.hostname;
  } catch {
    return false;
  }
}
