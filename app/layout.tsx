import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./suppress-recharts-warnings";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinBoard - Customizable Finance Dashboard",
  description: "Build your own real-time finance monitoring dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
