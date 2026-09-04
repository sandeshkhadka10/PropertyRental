// Shared between the client provider and the server rendered boot script, so it
// lives in a plain module rather than in either of them - a 'use client' file
// hands server components a module reference instead of the value.
export const THEME_STORAGE_KEY = 'propertyrental-theme';

export const THEMES = ['light', 'dark', 'system'];
