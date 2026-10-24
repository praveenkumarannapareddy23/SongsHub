import { Geist, Geist_Mono, Lato, NTR, Playfair_Display, Noto_Serif_Telugu, Noto_Sans_Telugu, Merriweather, Inter } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/context/audio-context";
import { SearchProvider } from "@/context/search-context";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/context/auth-context";
import { TourProvider } from "@/context/tour-context";
import AppLayout from "@/components/layout/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
});

const ntr = NTR({
  variable: "--font-ntr",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const notoSerifTelugu = Noto_Serif_Telugu({
  variable: "--font-noto-serif-telugu",
  subsets: ["telugu"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});

const notoSansTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-sans-telugu",
  subsets: ["telugu"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0F18",
};

export const metadata = {
  metadataBase: new URL("https://youworship.world"),
  title: {
    default: "YouWorship — Christian Songs, Lyrics, Audio & Videos",
    template: "%s | YouWorship",
  },
  description:
    "A Christ-centered worship platform. Discover thousands of Telugu, English, and Hindi Christian worship songs with synchronized lyrics, chords, high-quality audio, and videos.",
  keywords: [
    "YouWorship",
    "You Worship",
    "youworship.world",
    "Telugu Christian Songs",
    "Christian Worship Songs",
    "Telugu Christian Lyrics",
    "Worship Lyrics and Chords",
    "Christian Songs Audio & Video",
    "True Harvest Worship",
  ],
  authors: [{ name: "YouWorship", url: "https://youworship.world" }],
  creator: "YouWorship",
  publisher: "YouWorship",
  alternates: {
    canonical: "https://youworship.world",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://youworship.world",
    siteName: "YouWorship",
    title: "YouWorship — Christian Songs, Lyrics, Audio & Videos",
    description:
      "A Christ-centered worship platform. Discover thousands of Telugu, English, and Hindi Christian worship songs with lyrics, audio, and videos.",
    images: [
      {
        url: "/youworship-logo.png",
        width: 512,
        height: 512,
        alt: "YouWorship Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouWorship — Christian Songs, Lyrics, Audio & Videos",
    description:
      "A Christ-centered worship platform. Discover Telugu & English Christian worship songs with lyrics, audio, and videos.",
    images: ["/youworship-logo.png"],
    creator: "@YouWorship",
  },
  icons: {
    icon: "/youworship-logo.png",
    shortcut: "/youworship-logo.png",
    apple: "/youworship-logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  const jsonLdWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "YouWorship",
    alternateName: [
      "You Worship",
      "YouWorship World",
      "YouWorship Christian Songs",
    ],
    url: "https://youworship.world",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://youworship.world/?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "YouWorship",
    url: "https://youworship.world",
    logo: "https://youworship.world/youworship-logo.png",
    sameAs: ["https://youworship.world"],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lato.variable} ${ntr.variable} ${playfair.variable} ${notoSerifTelugu.variable} ${notoSansTelugu.variable} ${merriweather.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-Z165Z8BMBX"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-Z165Z8BMBX');
            `,
          }}
        />
        {/* Schema.org Structured Data for Google Autocomplete & Brand Recognition */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body className="text-title font-sans select-none">
        <ThemeProvider>
          <AuthProvider>
            <AudioProvider>
              <SearchProvider>
                <TourProvider>
                  <AppLayout>{children}</AppLayout>
                </TourProvider>
              </SearchProvider>
            </AudioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
