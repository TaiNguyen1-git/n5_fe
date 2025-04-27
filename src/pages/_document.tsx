import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

export default function MyDocument() {
  return (
    <Html lang="en" className="light">
      <Head />
      <body className="light-mode">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
