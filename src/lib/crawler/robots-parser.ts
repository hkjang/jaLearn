/**
 * Robots.txt Parser
 * Parse and check robots.txt compliance
 */

export interface RobotsRule {
  userAgent: string;
  disallowPaths: string[];
  allowPaths: string[];
  crawlDelay: number | null;
}

export interface RobotsResult {
  rules: RobotsRule[];
  sitemaps: string[];
  isAllowed: (path: string, userAgent?: string) => boolean;
  getCrawlDelay: (userAgent?: string) => number | null;
}

/**
 * Fetch and parse robots.txt
 */
export async function fetchRobotsTxt(baseUrl: string): Promise<RobotsResult | null> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'JaLearn-Crawler/1.0',
      },
    });

    if (!response.ok) {
      // No robots.txt means everything is allowed
      return createDefaultRobots();
    }

    const text = await response.text();
    return parseRobotsTxt(text);
  } catch {
    // On error, assume allowed but with caution
    return createDefaultRobots();
  }
}

/**
 * Parse robots.txt content
 */
export function parseRobotsTxt(content: string): RobotsResult {
  const lines = content.split('\n').map(line => line.trim());
  const rules: RobotsRule[] = [];
  const sitemaps: string[] = [];
  
  let currentRule: RobotsRule | null = null;

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line === '') continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const directive = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    switch (directive) {
      case 'user-agent':
        if (currentRule) {
          rules.push(currentRule);
        }
        currentRule = {
          userAgent: value,
          disallowPaths: [],
          allowPaths: [],
          crawlDelay: null,
        };
        break;
      
      case 'disallow':
        if (currentRule && value) {
          currentRule.disallowPaths.push(value);
        }
        break;
      
      case 'allow':
        if (currentRule && value) {
          currentRule.allowPaths.push(value);
        }
        break;
      
      case 'crawl-delay':
        if (currentRule) {
          const delay = parseFloat(value);
          if (!isNaN(delay)) {
            currentRule.crawlDelay = delay * 1000; // Convert to ms
          }
        }
        break;
      
      case 'sitemap':
        if (value) {
          sitemaps.push(value);
        }
        break;
    }
  }

  if (currentRule) {
    rules.push(currentRule);
  }

  // Return result with helper functions
  return {
    rules,
    sitemaps,
    isAllowed: (path: string, userAgent = '*') => checkIsAllowed(rules, path, userAgent),
    getCrawlDelay: (userAgent = '*') => getCrawlDelayForAgent(rules, userAgent),
  };
}

/**
 * Check if path is allowed for user agent
 */
function checkIsAllowed(rules: RobotsRule[], path: string, userAgent: string): boolean {
  // Find matching rule
  const matchingRule = rules.find(r => 
    r.userAgent === userAgent || 
    r.userAgent === '*'
  ) || rules.find(r => r.userAgent === '*');

  if (!matchingRule) {
    return true; // No rules means allowed
  }

  // Check allow paths first (they take precedence)
  for (const allowPath of matchingRule.allowPaths) {
    if (pathMatches(path, allowPath)) {
      return true;
    }
  }

  // Check disallow paths
  for (const disallowPath of matchingRule.disallowPaths) {
    if (pathMatches(path, disallowPath)) {
      return false;
    }
  }

  return true;
}

/**
 * Get crawl delay for user agent
 */
function getCrawlDelayForAgent(rules: RobotsRule[], userAgent: string): number | null {
  const matchingRule = rules.find(r => 
    r.userAgent === userAgent || 
    r.userAgent === '*'
  );
  return matchingRule?.crawlDelay ?? null;
}

/**
 * Check if path matches a robots rule pattern
 */
function pathMatches(path: string, pattern: string): boolean {
  // Handle wildcard patterns
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(path);
  }
  
  // Handle $ (end of path)
  if (pattern.endsWith('$')) {
    return path === pattern.slice(0, -1);
  }
  
  // Default: prefix match
  return path.startsWith(pattern);
}

/**
 * Create default robots result (everything allowed)
 */
function createDefaultRobots(): RobotsResult {
  return {
    rules: [],
    sitemaps: [],
    isAllowed: () => true,
    getCrawlDelay: () => null,
  };
}

/**
 * Check if crawling is allowed for a URL
 */
export async function checkUrlAllowed(url: string): Promise<{
  allowed: boolean;
  crawlDelay: number | null;
}> {
  try {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const path = urlObj.pathname;

    const robots = await fetchRobotsTxt(baseUrl);
    
    return {
      allowed: robots?.isAllowed(path) ?? true,
      crawlDelay: robots?.getCrawlDelay() ?? null,
    };
  } catch {
    return { allowed: true, crawlDelay: null };
  }
}
