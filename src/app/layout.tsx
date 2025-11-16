import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "@/app/components/SessionProvider";
import Navigation from "@/app/components/Navigation";

const geistSans = Geist({});
const geistMono = Geist_Mono({});

export const metadata: Metadata = {
  title: "Next Auth App",
  description: "My Next Auth App",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Navigation />
          <Provider>
          <main>{children}</main>
        </Provider>
      </body>
    </html>
  );
}
