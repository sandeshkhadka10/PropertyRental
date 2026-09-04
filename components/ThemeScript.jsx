import { THEME_STORAGE_KEY } from '@/lib/theme';

// Runs synchronously before the rest of the document is parsed, so the page is
// already painted in the right theme on the first frame instead of flashing
// light and then switching once React has hydrated.
const bootScript = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var d=s==='dark'||((s==='system'||s===null)&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

const ThemeScript = () => (
    <script dangerouslySetInnerHTML={{ __html: bootScript }} />
);

export default ThemeScript;
