'use client';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { THEME_STORAGE_KEY, THEMES } from '@/lib/theme';

const ThemeContext = createContext(null);

const systemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const resolveTheme = (theme) => (theme === 'system' ? systemTheme() : theme);

export function ThemeProvider({ children }) {
    // both of these start on the values the server rendered with. The stored
    // choice is read in the effect below rather than during the first render so
    // hydration still matches - the boot script has already painted the right
    // theme by then, so there is nothing to see.
    const [theme, setThemeState] = useState('system');
    const [resolvedTheme, setResolvedTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        let stored = null;

        try {
            stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        } catch {
            // private mode or blocked storage - fall back to the system preference
        }

        const initial = THEMES.includes(stored) ? stored : 'system';

        setThemeState(initial);
        setResolvedTheme(resolveTheme(initial));
        setMounted(true);
    }, []);

    // follow the OS for as long as the user has not pinned a theme
    useEffect(() => {
        if (!mounted || theme !== 'system') return;

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => setResolvedTheme(media.matches ? 'dark' : 'light');

        onChange();
        media.addEventListener('change', onChange);

        return () => media.removeEventListener('change', onChange);
    }, [mounted, theme]);

    // the `dark` class is what every dark: utility and the compatibility layer
    // in globals.css hang off, and color-scheme rides along with it in CSS
    useEffect(() => {
        if (!mounted) return;

        document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    }, [mounted, resolvedTheme]);

    const setTheme = useCallback((next) => {
        if (!THEMES.includes(next)) return;

        setThemeState(next);
        setResolvedTheme(resolveTheme(next));

        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // the theme still applies for this visit, it just will not be remembered
        }
    }, []);

    // toggling always pins an explicit theme - going back to 'system' is a
    // deliberate choice, not something a single click should land on
    const toggleTheme = useCallback(() => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    }, [resolvedTheme, setTheme]);

    const value = useMemo(
        () => ({ theme, resolvedTheme, mounted, setTheme, toggleTheme }),
        [theme, resolvedTheme, mounted, setTheme, toggleTheme]
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used inside a <ThemeProvider>');
    }

    return context;
}
