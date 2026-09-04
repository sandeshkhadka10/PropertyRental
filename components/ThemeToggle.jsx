'use client';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '@/components/ThemeProvider';

// Sits on the blue navbar in both themes, so it is styled against that rather
// than against the page surface.
const ThemeToggle = ({ className = '', showLabel = false }) => {
    const { resolvedTheme, mounted, toggleTheme } = useTheme();

    // before mount the stored choice has not been read yet - render the light
    // theme icon, which is what the server rendered, and let the effect correct
    // it. Nothing shifts, it is one icon swap.
    const isDark = mounted && resolvedTheme === 'dark';
    const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

    return (
        <button
            type='button'
            onClick={toggleTheme}
            title={label}
            aria-label={label}
            className={`flex items-center gap-2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700 ${className}`}
        >
            {isDark ? (
                <FaSun className='h-5 w-5' />
            ) : (
                <FaMoon className='h-5 w-5' />
            )}
            {showLabel && (
                <span className='text-base font-medium'>
                    {isDark ? 'Light theme' : 'Dark theme'}
                </span>
            )}
        </button>
    );
};

export default ThemeToggle;
