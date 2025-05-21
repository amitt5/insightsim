/**
 * InsightSim Typography System
 * 
 * This file defines typography scales, styles, and utilities for consistent text presentation
 * throughout the application.
 */

export type FontWeight = 
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold';

export type FontSize = 
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl';

export type LineHeight = 
  | 'none'
  | 'tight'
  | 'snug'
  | 'normal'
  | 'relaxed'
  | 'loose';

export type LetterSpacing = 
  | 'tighter'
  | 'tight'
  | 'normal'
  | 'wide'
  | 'wider'
  | 'widest';

export type TextStyle = {
  fontSize: FontSize;
  fontWeight: FontWeight;
  lineHeight: LineHeight;
  letterSpacing?: LetterSpacing;
};

/**
 * Typography scale for the application
 */
export const typography = {
  // Heading styles
  h1: {
    fontSize: '5xl',
    fontWeight: 'bold',
    lineHeight: 'tight',
    letterSpacing: 'tight',
  } as TextStyle,
  
  h2: {
    fontSize: '4xl',
    fontWeight: 'bold',
    lineHeight: 'tight',
    letterSpacing: 'tight',
  } as TextStyle,
  
  h3: {
    fontSize: '3xl',
    fontWeight: 'semibold',
    lineHeight: 'tight',
  } as TextStyle,
  
  h4: {
    fontSize: '2xl',
    fontWeight: 'semibold',
    lineHeight: 'tight',
  } as TextStyle,
  
  h5: {
    fontSize: 'xl',
    fontWeight: 'semibold',
    lineHeight: 'normal',
  } as TextStyle,
  
  h6: {
    fontSize: 'lg',
    fontWeight: 'semibold',
    lineHeight: 'normal',
  } as TextStyle,
  
  // Body text styles
  bodyLarge: {
    fontSize: 'lg',
    fontWeight: 'normal',
    lineHeight: 'relaxed',
  } as TextStyle,
  
  bodyDefault: {
    fontSize: 'base',
    fontWeight: 'normal',
    lineHeight: 'relaxed',
  } as TextStyle,
  
  bodySmall: {
    fontSize: 'sm',
    fontWeight: 'normal',
    lineHeight: 'relaxed',
  } as TextStyle,
  
  // UI text styles
  buttonLarge: {
    fontSize: 'base',
    fontWeight: 'medium',
    lineHeight: 'none',
    letterSpacing: 'wide',
  } as TextStyle,
  
  buttonDefault: {
    fontSize: 'sm',
    fontWeight: 'medium',
    lineHeight: 'none',
    letterSpacing: 'wide',
  } as TextStyle,
  
  buttonSmall: {
    fontSize: 'xs',
    fontWeight: 'medium',
    lineHeight: 'none',
    letterSpacing: 'wide',
  } as TextStyle,
  
  label: {
    fontSize: 'sm',
    fontWeight: 'medium',
    lineHeight: 'normal',
  } as TextStyle,
  
  caption: {
    fontSize: 'xs',
    fontWeight: 'normal',
    lineHeight: 'normal',
  } as TextStyle,
  
  overline: {
    fontSize: 'xs',
    fontWeight: 'medium',
    lineHeight: 'normal',
    letterSpacing: 'wider',
  } as TextStyle,
};

/**
 * Get Tailwind classes for a typography style
 */
export function getTypographyClasses(style: TextStyle): string {
  const classes = [
    `text-${style.fontSize}`,
    `font-${style.fontWeight}`,
    `leading-${style.lineHeight}`,
  ];
  
  if (style.letterSpacing) {
    classes.push(`tracking-${style.letterSpacing}`);
  }
  
  return classes.join(' ');
}

/**
 * Get Tailwind classes for a heading level
 */
export function getHeadingClasses(level: 1 | 2 | 3 | 4 | 5 | 6): string {
  const headingStyles = {
    1: typography.h1,
    2: typography.h2,
    3: typography.h3,
    4: typography.h4,
    5: typography.h5,
    6: typography.h6,
  };
  
  return getTypographyClasses(headingStyles[level]);
}

/**
 * Get Tailwind classes for body text
 */
export function getBodyClasses(size: 'large' | 'default' | 'small' = 'default'): string {
  const bodyStyles = {
    large: typography.bodyLarge,
    default: typography.bodyDefault,
    small: typography.bodySmall,
  };
  
  return getTypographyClasses(bodyStyles[size]);
}

/**
 * Get Tailwind classes for a button
 */
export function getButtonClasses(size: 'large' | 'default' | 'small' = 'default'): string {
  const buttonStyles = {
    large: typography.buttonLarge,
    default: typography.buttonDefault,
    small: typography.buttonSmall,
  };
  
  return getTypographyClasses(buttonStyles[size]);
}
