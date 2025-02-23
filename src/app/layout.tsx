import Providers from "./providers";
import "./globals.css"; // Keep your global styles

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers> {/* ✅ Wrap your app inside <SessionProvider /> */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
