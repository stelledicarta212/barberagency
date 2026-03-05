import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BARBERAGENCY",
  description: "SaaS frontend mock for barber shop management",
};

const themeInitScript = `
(() => {
  try {
    const saved = localStorage.getItem("ba_theme");
    const valid = saved === "light" || saved === "dark";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = valid ? saved : (systemDark ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
