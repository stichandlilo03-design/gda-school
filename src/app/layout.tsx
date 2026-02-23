import type { Metadata, Viewport } from "next";
import Providers from "@/components/providers";
import "./globals.css";

const SITE_URL = "https://www.gdaschools.sbs";
const SITE_NAME = "GDA Schools";
const SITE_TITLE = "GDA Schools — The Smartest Way to Run a School in Africa";
const SITE_DESC = "Live virtual classrooms, automatic teacher payroll, real-time fee tracking, student grades, timetables, and school management — all in one platform. Built for schools across Africa. Kindergarten to Senior Secondary.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | GDA Schools",
  },
  description: SITE_DESC,
  keywords: [
    "online school Africa", "virtual classroom", "school management system",
    "digital school Nigeria", "digital school Kenya", "digital school Ghana",
    "digital school South Africa", "e-learning Africa", "school management software",
    "live classroom", "teacher payroll", "school fees tracking", "student portal",
    "parent portal", "principal dashboard", "school app", "education technology",
    "edtech Africa", "online learning platform", "K-12 school management",
    "GDA Schools", "Global Digital Academy", "African schools online",
    "virtual school", "remote learning Africa", "school ERP",
    "homework system", "grading system", "attendance tracker",
    "school timetable", "report cards online", "fee payment school",
    "teach online Africa", "earn teaching online",
  ],
  authors: [{ name: "GDA Schools", url: SITE_URL }],
  creator: "GDA Schools",
  publisher: "Global Digital Academy",
  applicationName: "GDA Schools",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "Education",

  // Open Graph (Facebook, LinkedIn, WhatsApp)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GDA Schools — Live Classes, Auto Payroll, Fee Tracking for African Schools",
        type: "image/png",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ["/opengraph-image"],
    creator: "@gdaschools",
    site: "@gdaschools",
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification — add your real codes when you get them
  verification: {
    google: "6lbw76qSw4MzoOhQI6KdkpvuANr7MEh_CAdSh7uxapo",
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },

  // Manifest (PWA)
  manifest: "/manifest.json",

  // Other
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "GDA Schools",
    "theme-color": "#1B3A5C",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B3A5C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="6lbw76qSw4MzoOhQI6KdkpvuANr7MEh_CAdSh7uxapo" />
        <meta name="google-adsense-account" content="ca-pub-6892230955738208">
        {/* Structured Data — JSON-LD for Google */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6892230955738208"
     crossOrigin="anonymous"></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              name: "GDA Schools — Global Digital Academy",
              alternateName: "GDA Schools",
              url: SITE_URL,
              logo: `${SITE_URL}/apple-icon`,
              description: SITE_DESC,
              sameAs: [
                "https://twitter.com/gdaschools",
                "https://facebook.com/gdaschools",
                "https://instagram.com/gdaschools",
              ],
              areaServed: [
                { "@type": "Country", name: "Nigeria" },
                { "@type": "Country", name: "Kenya" },
                { "@type": "Country", name: "Ghana" },
                { "@type": "Country", name: "South Africa" },
                { "@type": "Country", name: "Tanzania" },
                { "@type": "Country", name: "Uganda" },
                { "@type": "Country", name: "Rwanda" },
                { "@type": "Country", name: "Ethiopia" },
                { "@type": "Country", name: "Cameroon" },
                { "@type": "Country", name: "Senegal" },
                { "@type": "Country", name: "Zimbabwe" },
                { "@type": "Country", name: "Zambia" },
                { "@type": "Country", name: "Mozambique" },
                { "@type": "Country", name: "India" },
              ],
              offers: {
                "@type": "Offer",
                description: "School management platform with live classrooms, payroll, fee tracking, and student portals",
                category: "Education Technology",
              },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "GDA Schools Features",
                itemListElement: [
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Live Virtual Classrooms" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Automatic Teacher Payroll" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Student & Parent Portals" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Fee Tracking & Payment" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Grading & Report Cards" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Timetable Management" } },
                ],
              },
            }),
          }}
        />
        {/* FAQ Schema for richer Google results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is GDA Schools?",
                  acceptedAnswer: { "@type": "Answer", text: "GDA Schools is a complete digital school management platform that provides live virtual classrooms, automatic teacher payroll, real-time fee tracking, student grades, timetables, and more — all in one place. It works for schools from Kindergarten to Senior Secondary across 14 African countries." },
                },
                {
                  "@type": "Question",
                  name: "Which countries does GDA Schools support?",
                  acceptedAnswer: { "@type": "Answer", text: "GDA Schools currently supports schools in Nigeria, Kenya, Ghana, South Africa, Tanzania, Uganda, Rwanda, Ethiopia, Cameroon, Senegal, Zimbabwe, Zambia, Mozambique, and India — with more countries being added." },
                },
                {
                  "@type": "Question",
                  name: "How do teachers get paid on GDA Schools?",
                  acceptedAnswer: { "@type": "Answer", text: "GDA Schools automatically tracks every teaching session minute by minute. Teacher payroll is calculated automatically based on session credits — no manual tracking needed. Teachers can view their earnings and payment history in real time." },
                },
                {
                  "@type": "Question",
                  name: "Can parents monitor their children on GDA Schools?",
                  acceptedAnswer: { "@type": "Answer", text: "Yes! Parents get their own portal where they can see their child's attendance, grades, report cards, fee payments, timetable, and even chat directly with teachers and the principal." },
                },
                {
                  "@type": "Question",
                  name: "How do students attend classes on GDA Schools?",
                  acceptedAnswer: { "@type": "Answer", text: "Students join live virtual classrooms where teachers write on a digital blackboard, conduct polls, share materials, and interact through video and voice — all from a phone, tablet, or computer." },
                },
              ],
            }),
          }}
        />
        {/* Software Application Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "GDA Schools",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web, Android, iOS",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free to start" },
              aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "150", bestRating: "5" },
            }),
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
