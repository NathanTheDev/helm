import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import AuthGate from "@/components/auth/AuthGate";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { THEME_STORAGE_KEY, CUSTOM_THEME_STORAGE_KEY, CUSTOM_THEME_VARS } from "@/lib/theme-constants";
import { FONT_STORAGE_KEY, DEFAULT_FONT } from "@/lib/font-constants";
import "./globals.css";

// Runs before first paint so the stored (or system-preferred) theme/font -
// including a user-created "Custom" palette - is applied without a flash
// of the default palette.
const CUSTOM_THEME_KEYS = JSON.stringify(CUSTOM_THEME_VARS.map((v) => v.key));
const THEME_INIT_SCRIPT = `(function(){try{
  var k=${JSON.stringify(THEME_STORAGE_KEY)};
  var s=localStorage.getItem(k);
  var t=s||(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"paper");
  document.documentElement.setAttribute("data-theme",t);
  if(t==="custom"){
    var raw=localStorage.getItem(${JSON.stringify(CUSTOM_THEME_STORAGE_KEY)});
    if(raw){
      var c=JSON.parse(raw);
      ${CUSTOM_THEME_KEYS}.forEach(function(key){
        if(c[key]) document.documentElement.style.setProperty("--"+key,c[key]);
      });
    }
  }
  var f=localStorage.getItem(${JSON.stringify(FONT_STORAGE_KEY)})||${JSON.stringify(DEFAULT_FONT)};
  document.documentElement.setAttribute("data-font",f);
}catch(e){}})();`;

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Helm",
  description: "Your day, at a glance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>
          <AuthProvider>
            <NavBar />
            <AuthGate>
              <div className="flex-1 flex flex-col">{children}</div>
            </AuthGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
