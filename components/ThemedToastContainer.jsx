'use client';
import { ToastContainer } from 'react-toastify';
import { useTheme } from '@/components/ThemeProvider';

// react-toastify paints its own surfaces, so it needs telling which theme it is
// sitting on rather than picking it up from our CSS.
const ThemedToastContainer = () => {
    const { resolvedTheme, mounted } = useTheme();

    return <ToastContainer theme={mounted ? resolvedTheme : 'light'} />;
};

export default ThemedToastContainer;
