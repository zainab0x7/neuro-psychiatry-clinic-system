import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "NPCS.digital | Dr. Shahab Muhammad Khan — Consultant Psychiatrist",
  description: "Official digital health platform & private psychiatric practice of Dr. Shahab Muhammad Khan, Consultant Psychiatrist (Department of Psychiatry, PNS Shifa Hospital). Thoughtful psychiatric assessment, evidence-informed care, and compassionate recovery.",
  keywords: [
    "Dr Shahab Muhammad Khan",
    "Consultant Psychiatrist",
    "PNS Shifa Hospital Psychiatry",
    "Psychiatrist Karachi",
    "Mental Health Consultation",
    "Soul Care Terrace",
    "NPCS digital",
    "Psychiatric Assessment",
    "Medication Management",
  ],
  authors: [{ name: "Dr. Shahab Muhammad Khan" }],
  openGraph: {
    title: "NPCS.digital | Dr. Shahab Muhammad Khan — Consultant Psychiatrist",
    description: "Evidence-informed psychiatric care and compassionate mental health assessments by Dr. Shahab Muhammad Khan.",
    url: "https://npcs.digital",
    siteName: "NPCS.digital",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
