import type { Metadata } from "next";
//import Head from 'next/head';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConditionalSidebar } from "@/components/conditionalSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BESTCEMENT SALES CMS",
  description: "Made by Mycoco",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
     
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConditionalSidebar>
          {children}
        </ConditionalSidebar>
      </body>
    </html>
  );
}
