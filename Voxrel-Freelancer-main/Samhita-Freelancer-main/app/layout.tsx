import type { Metadata } from "next";
import { Outfit } from "next/font/google";

import { AuthInitializer } from "@/components/auth-initializer";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/providers/query-provider";

import "./globals.css";
import "./toast-animations.css";

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
                        <AuthInitializer />
                        {children}
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}