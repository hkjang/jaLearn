/**
 * Crawler Pipeline
 * Orchestrates the complete crawling process
 */

import { crawlPage, downloadFile, sleep, isSameDomain } from './crawler-engine';
import { fetchRobotsTxt, RobotsResult } from './robots-parser';
import { parsePdfBuffer, cleanPdfText, isImageBasedPdf } from './pdf-parser';
import { extractProblems, ExtractionResult } from './problem-extractor';

export interface PipelineConfig {
  sourceId: string;
  baseUrl: string;
  crawlPattern?: string;
  linkSelector?: string;
  fileTypes: string[];
  maxDepth: number;
  crawlDelay: number;
  maxPages?: number;
  maxFiles?: number;
}

export interface PipelineProgress {
  status: 'running' | 'completed' | 'failed';
  pagesVisited: number;
  filesFound: number;
  filesSaved: number;
  problemsExtracted: number;
  errors: string[];
  currentUrl?: string;
}

export interface CrawledFile {
  url: string;
  fileName: string;
  fileType: string;
  buffer: Buffer;
  text?: string;
  problems?: ExtractionResult;
  metadata?: {
    year?: number;
    month?: number;
    examName?: string;
    subject?: string;
  };
}

type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * Run the complete crawling pipeline
 */
export async function runCrawlPipeline(
  config: PipelineConfig,
  onProgress?: ProgressCallback
): Promise<{
  files: CrawledFile[];
  progress: PipelineProgress;
}> {
  const progress: PipelineProgress = {
    status: 'running',
    pagesVisited: 0,
    filesFound: 0,
    filesSaved: 0,
    problemsExtracted: 0,
    errors: [],
  };

  const files: CrawledFile[] = [];
  const visitedUrls = new Set<string>();
  const pendingUrls: { url: string; depth: number }[] = [{ url: config.baseUrl, depth: 0 }];

  // Fetch robots.txt
  let robots: RobotsResult | null = null;
  try {
    robots = await fetchRobotsTxt(config.baseUrl);
  } catch {
    // Continue without robots
  }

  const urlPattern = config.crawlPattern ? new RegExp(config.crawlPattern) : null;
  const fileExtPattern = new RegExp(`\\.(${config.fileTypes.join('|')})$`, 'i');

  // Main crawl loop
  while (pendingUrls.length > 0) {
    // Check limits
    if (config.maxPages && progress.pagesVisited >= config.maxPages) break;
    if (config.maxFiles && progress.filesSaved >= config.maxFiles) break;

    const { url, depth } = pendingUrls.shift()!;
    
    // Skip if already visited
    if (visitedUrls.has(url)) continue;
    visitedUrls.add(url);

    // Check robots.txt
    if (robots && !robots.isAllowed(new URL(url).pathname)) {
      continue;
    }

    progress.currentUrl = url;
    onProgress?.(progress);

    // Respect crawl delay
    await sleep(config.crawlDelay);

    // Crawl page
    const result = await crawlPage(url);
    
    if (!result.success) {
      progress.errors.push(`${url}: ${result.error}`);
      continue;
    }

    progress.pagesVisited++;

    // Extract file links
    for (const fileLink of result.fileLinks) {
      if (fileExtPattern.test(fileLink.url)) {
        progress.filesFound++;

        // Download file
        const downloadResult = await downloadFile(fileLink.url);
        
        if (downloadResult.success && downloadResult.data) {
          const crawledFile: CrawledFile = {
            url: fileLink.url,
            fileName: fileLink.name,
            fileType: fileLink.type,
            buffer: downloadResult.data,
          };

          // Process PDF
          if (fileLink.type.toLowerCase() === 'pdf') {
            const pdfResult = await parsePdfBuffer(downloadResult.data);
            
            if (pdfResult.success) {
              const cleanedText = cleanPdfText(pdfResult.text);
              crawledFile.text = cleanedText;

              // Check if OCR is needed
              if (!isImageBasedPdf(cleanedText, pdfResult.pages)) {
                // Extract problems
                const extraction = extractProblems(cleanedText);
                crawledFile.problems = extraction;
                crawledFile.metadata = extraction.metadata;
                progress.problemsExtracted += extraction.problems.length;
              }
            }
          }

          files.push(crawledFile);
          progress.filesSaved++;
        } else {
          progress.errors.push(`Download failed: ${fileLink.url}`);
        }
      }
    }

    // Add new URLs to queue (if within depth limit)
    if (depth < config.maxDepth) {
      for (const link of result.links) {
        // Only follow same-domain links
        if (!isSameDomain(config.baseUrl, link)) continue;
        
        // Check pattern if specified
        if (urlPattern && !urlPattern.test(link)) continue;

        if (!visitedUrls.has(link)) {
          pendingUrls.push({ url: link, depth: depth + 1 });
        }
      }
    }

    onProgress?.(progress);
  }

  progress.status = progress.errors.length > 10 ? 'failed' : 'completed';
  progress.currentUrl = undefined;

  return { files, progress };
}

/**
 * Process a single file (for re-processing)
 */
export async function processFile(
  buffer: Buffer,
  fileType: string
): Promise<{
  text: string;
  problems: ExtractionResult | null;
  needsOcr: boolean;
}> {
  if (fileType.toLowerCase() !== 'pdf') {
    return { text: '', problems: null, needsOcr: false };
  }

  const pdfResult = await parsePdfBuffer(buffer);
  
  if (!pdfResult.success) {
    return { text: '', problems: null, needsOcr: true };
  }

  const cleanedText = cleanPdfText(pdfResult.text);
  const needsOcr = isImageBasedPdf(cleanedText, pdfResult.pages);

  if (needsOcr) {
    return { text: cleanedText, problems: null, needsOcr: true };
  }

  const extraction = extractProblems(cleanedText);
  return { text: cleanedText, problems: extraction, needsOcr: false };
}
