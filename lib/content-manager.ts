// Content management utilities for public pages

export interface ContentItem {
  id: string;
  page: string;
  section: string;
  key: string;
  content: {
    [locale: string]: string;
  };
  active: boolean;
  createdAt: number;
  updatedAt: number;
  updatedBy: string;
}

export interface ContentData {
  [section: string]: {
    [key: string]: string;
  };
}

/**
 * Fetch content for a specific page and locale
 */
export async function fetchPageContent(page: string, locale: string = 'pt'): Promise<ContentData> {
  try {
    const response = await fetch(`/api/content/public?page=${page}&locale=${locale}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching page content:', error);
    return {};
  }
}

/**
 * Get content with fallback to default locale
 */
export function getContent(
  contentData: ContentData, 
  section: string, 
  key: string, 
  fallback: string = ''
): string {
  try {
    return contentData[section]?.[key] || fallback;
  } catch (error) {
    console.error('Error getting content:', error);
    return fallback;
  }
}

/**
 * Get content array (for lists, features, etc.)
 */
export function getContentArray(
  contentData: ContentData, 
  section: string, 
  key: string, 
  fallback: any[] = []
): any[] {
  try {
    const content = contentData[section]?.[key];
    if (Array.isArray(content)) {
      return content;
    }
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch {
        return fallback;
      }
    }
    return fallback;
  } catch (error) {
    console.error('Error getting content array:', error);
    return fallback;
  }
}

/**
 * Merge CMS content with translation fallbacks
 */
export function mergeContentWithTranslations(
  cmsContent: ContentData,
  translations: any,
  page: string
): any {
  try {
    const merged = { ...translations };
    
    // Override translation keys with CMS content
    if (cmsContent && typeof cmsContent === 'object') {
      Object.keys(cmsContent).forEach(section => {
        if (!merged[section]) {
          merged[section] = {};
        }
        
        if (cmsContent[section] && typeof cmsContent[section] === 'object') {
          Object.keys(cmsContent[section]).forEach(key => {
            const cmsValue = cmsContent[section][key];
            if (cmsValue && typeof cmsValue === 'string' && cmsValue.trim() !== '') {
              merged[section][key] = cmsValue;
            } else if (cmsValue && typeof cmsValue !== 'string') {
              // Handle non-string values (objects, arrays, etc.)
              merged[section][key] = cmsValue;
            }
          });
        }
      });
    }
    
    return merged;
  } catch (error) {
    console.error('Error merging content with translations:', error);
    return translations; // Fallback to original translations
  }
}

/**
 * Content validation helpers
 */
export const contentValidators = {
  required: (value: string): boolean => {
    return value && value.trim().length > 0;
  },
  
  minLength: (value: string, min: number): boolean => {
    return value && value.trim().length >= min;
  },
  
  maxLength: (value: string, max: number): boolean => {
    return value && value.trim().length <= max;
  },
  
  isUrl: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  
  isEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
};

/**
 * Content transformation helpers
 */
export const contentTransformers = {
  toTitleCase: (text: string): string => {
    return text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },
  
  toSlug: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
  
  truncate: (text: string, length: number, suffix: string = '...'): string => {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + suffix;
  },
  
  stripHtml: (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  }
};
