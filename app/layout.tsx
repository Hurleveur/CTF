import './globals.css';
import { Inter } from 'next/font/google';
import Navigation from './components/Navigation';
import FabrileChatbot from './components/FabrileChatbot';
import { AuthProvider } from './contexts/AuthContext';
import { UserDataProvider } from './contexts/UserDataContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'RoboTech Industries - Advanced Robotics Manufacturing',
  description: 'Leading manufacturer of industrial robotics and automation solutions for modern manufacturing.',
  icons: {
    icon: [
      { url: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
  manifest: '/site.webmanifest',
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <AuthProvider>
          <UserDataProvider>
            <ProjectProvider>
              <NotificationsProvider>
                <Navigation />
                <main className="min-h-screen bg-gray-50 text-gray-900">
                  {children}
                </main>
                <FabrileChatbot />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 6000,
                    style: {
                      background: '#1f2937',
                      color: '#ffffff',
                      border: '1px solid #374151',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                    },
                  }}
                />
              </NotificationsProvider>
            </ProjectProvider>
          </UserDataProvider>
        </AuthProvider>
        <footer className="bg-gray-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">RoboTech Industries</h3>
                <p className="text-gray-300 text-sm">
                  Pioneering the future of manufacturing through advanced robotics and automation solutions.
                  Our cutting-edge technology drives efficiency and innovation across industries.
                </p>
              </div>
              <div>
                <h4 className="text-md font-semibold mb-4">Quick Links</h4>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li><a href="/about" className="hover:text-white">About Us</a></li>
                  <li><a href="/projects" className="hover:text-white">Projects</a></li>
                  <li><a href="/assembly-line" className="hover:text-white">Assembly Line Demo</a></li>
                  <li><a href="/login" className="hover:text-white">Login</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300 text-sm">
              <p>© 2025 North Star AGI. All rights reserved. | <a href="/privacy" className="hover:text-white">Privacy Policy</a> | <a href="/signup" className="hover:text-white">Terms of Service</a></p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
