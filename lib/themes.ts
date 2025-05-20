/**
 * InsightSim Theme System
 * 
 * This file defines all available themes and provides utilities for theme management.
 * Each theme includes a complete set of colors that can be applied throughout the application.
 */

export type ThemeColors = {
    name: string;
    colors: {
      primary: string;
      primaryLight: string;
      primaryLighter: string;
      secondary: string;
      secondaryLight: string;
      neutralDark: string;
      neutral: string;
      neutralLight: string;
      neutralLighter: string;
      background: string;
    };
  };
  
  export type ThemeName = 'refinedPurple' | 'corporateTrust' | 'modernExecutive' | string;
  
  /**
   * Available themes
   */
  export const themes: Record<ThemeName, ThemeColors> = {
    // Refined Purple theme
    refinedPurple: {
      name: 'Refined Purple',
      colors: {
        primary: '#5a189a',
        primaryLight: '#7b2cbf',
        primaryLighter: '#9d4edd',
        secondary: '#0cb7b7',
        secondaryLight: '#2fcece',
        neutralDark: '#2d2d3a',
        neutral: '#4a4a57',
        neutralLight: '#9090a0',
        neutralLighter: '#e2e2e8',
        background: '#f8f8fc',
      },
    },
    
    // Corporate Trust theme
    corporateTrust: {
      name: 'Corporate Trust',
      colors: {
        primary: '#1a365d',
        primaryLight: '#2a4a7f',
        primaryLighter: '#3a5fa0',
        secondary: '#e9b949',
        secondaryLight: '#f0ca71',
        neutralDark: '#2c3e50',
        neutral: '#4a5568',
        neutralLight: '#a0aec0',
        neutralLighter: '#e2e8f0',
        background: '#f7fafc',
      },
    },
    
    // Modern Executive theme
    modernExecutive: {
      name: 'Modern Executive',
      colors: {
        primary: '#2d3748',
        primaryLight: '#4a5568',
        primaryLighter: '#718096',
        secondary: '#047857',
        secondaryLight: '#059669',
        neutralDark: '#1a202c',
        neutral: '#4a5568',
        neutralLight: '#a0aec0',
        neutralLighter: '#e2e8f0',
        background: '#f7fafc',
      },
    },
  };
  
  /**
   * Default theme name
   */
  export const defaultTheme: ThemeName = 'modernExecutive';
  
  /**
   * Get a theme by name
   */
  export function getTheme(themeName: ThemeName = defaultTheme): ThemeColors {
    return themes[themeName] || themes[defaultTheme];
  }
  
  /**
   * Get CSS variables for a theme
   */
  export function getThemeCssVariables(themeName: ThemeName = defaultTheme): Record<string, string> {
    const theme = getTheme(themeName);
    
    return {
      '--primary': hexToHsl(theme.colors.primary),
      '--primary-light': hexToHsl(theme.colors.primaryLight),
      '--primary-lighter': hexToHsl(theme.colors.primaryLighter),
      '--primary-foreground': hexToHsl('#ffffff'),
      
      '--secondary': hexToHsl(theme.colors.secondary),
      '--secondary-light': hexToHsl(theme.colors.secondaryLight),
      '--secondary-foreground': hexToHsl('#ffffff'),
      
      '--background': hexToHsl(theme.colors.background),
      '--foreground': hexToHsl(theme.colors.neutralDark),
      
      '--muted': hexToHsl(theme.colors.neutralLighter),
      '--muted-foreground': hexToHsl(theme.colors.neutral),
      
      '--accent': hexToHsl(theme.colors.neutralLighter),
      '--accent-foreground': hexToHsl(theme.colors.neutralDark),
      
      '--destructive': hexToHsl('#ef4444'),
      '--destructive-foreground': hexToHsl('#ffffff'),
      
      '--border': hexToHsl(theme.colors.neutralLighter),
      '--input': hexToHsl(theme.colors.neutralLighter),
      '--ring': hexToHsl(theme.colors.primary),
      
      '--card': hexToHsl('#ffffff'),
      '--card-foreground': hexToHsl(theme.colors.neutralDark),
      
      '--popover': hexToHsl('#ffffff'),
      '--popover-foreground': hexToHsl(theme.colors.neutralDark),
      
      '--radius': '0.5rem',
    };
  }
  
  /**
   * Convert hex color to HSL format for CSS variables
   * This is a simplified version - in production, you'd want a more accurate conversion
   */
  function hexToHsl(hex: string): string {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Find the min and max values to compute the lightness
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Calculate the lightness
    const l = (max + min) / 2;
    
    // Calculate the saturation
    let s = 0;
    if (max !== min) {
      s = l > 0.5 
        ? (max - min) / (2 - max - min) 
        : (max - min) / (max + min);
    }
    
    // Calculate the hue
    let h = 0;
    if (max !== min) {
      if (max === r) {
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / (max - min) + 2;
      } else {
        h = (r - g) / (max - min) + 4;
      }
      h *= 60;
    }
    
    // Round the values
    h = Math.round(h);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  }
  
  /**
   * Apply theme to document
   * This function can be used in client components to apply the theme
   */
  export function applyTheme(themeName: ThemeName = defaultTheme): void {
    if (typeof document === 'undefined') return;
    
    const theme = getThemeCssVariables(themeName);
    const root = document.documentElement;
    
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }
  