import { Html, Head, Main, NextScript } from 'next/document';

const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('nt_theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="uz">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
