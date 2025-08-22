import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Robotics CTF',
  description: 'A secure foundation for a robotics-themed CTF platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-gray-800 text-white p-4 text-center">
          <h1 className="text-xl font-bold">Robotics CTF</h1>
        </header>
        <main className="min-h-screen p-6 bg-gray-900 text-gray-200">
          {children}
        </main>
        <footer className="bg-gray-800 text-white p-4 text-center text-sm">
          <p>© 2025 Robotics CTF. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
