import { Html, Head, Main, NextScript } from 'next/document';

// Minimal Document to satisfy Next.js Pages Router expectations during build.
// This file will not affect your App Router routes but prevents
// "Cannot find module for page: /_document" build errors.
export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

