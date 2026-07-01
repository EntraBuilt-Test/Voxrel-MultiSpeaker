import type { Metadata } from "next";
import { Outfit } from "next/font/google";

import { QueryProvider } from "@/components/providers/query.provider";
import { ThemeProvider } from "@/components/providers/theme.provider";

import "./globals.css";

const outfit = Outfit({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Kreactive App",
    description: "Kreactive App is a platform for transcripting and labeling audio and video files.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${outfit.variable} font-sans antialiased`}>
                <QueryProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}