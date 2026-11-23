import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solar Set Rebate Calculator",
  description: "Estimate the solar and battery rebates available to you.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
