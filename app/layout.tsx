import type { Metadata } from "next";
import {
  Inter,
  Space_Grotesk,
  Merriweather,
  Lora,
  Crimson_Text,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Elegant serif options - uncomment the one you want to use
const merriweather = Merriweather({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-display-alt",
  subsets: ["latin"],
  display: "swap",
});

const crimsonText = Crimson_Text({
  variable: "--font-display-alt2",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-display-alt3",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voice Chat - Realtime AI Conversation",
  description:
    "Experience seamless voice-to-text AI conversations with real-time streaming responses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${merriweather.variable} ${lora.variable} ${crimsonText.variable} ${playfair.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
