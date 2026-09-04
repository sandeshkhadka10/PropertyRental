import '@/assets/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import ThemedToastContainer from '@/components/ThemedToastContainer';
import 'react-toastify/dist/ReactToastify.css';
import { GlobalProvider } from '@/context/GlobalContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeScript from '@/components/ThemeScript';
import ChatBot from '@/components/ChatBot';
import 'photoswipe/dist/photoswipe.css';

export const metadata = {
    title: 'PropertyRental | Find The Perfect |Rental',
    description: 'Find your dream rental property',
    keywords: 'rental, find rentals, find properties'
};

const MainLayout = ({ children }) => {
    return (
        <GlobalProvider>
            <AuthProvider>
                <ThemeProvider>
                    {/* the boot script adds the `dark` class before hydration,
                        which React would otherwise flag as a mismatch */}
                    <html lang="en" suppressHydrationWarning>
                        <body className="min-h-screen flex flex-col">
                            <ThemeScript />

                            <Navbar />

                            <main className="flex-grow">
                                {children}
                            </main>

                            <Footer />

                            {/* floats over every page, so help is reachable
                                without leaving whatever the visitor is doing */}
                            <ChatBot />

                            <ThemedToastContainer />
                        </body>
                    </html>
                </ThemeProvider>
            </AuthProvider>
        </GlobalProvider>
    )
};

export default MainLayout;
