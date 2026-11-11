import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geistSans=Geist({variable:"--font-geist-sans",subsets:["latin"]});
const geistMono=Geist_Mono({variable:"--font-geist-mono",subsets:["latin"]});
export const metadata:Metadata={title:"BrickReel — LEGO Builder & Animator",description:"LEGO builder with full LDraw support: build, animate and export to Three.js, MP4 or GIF."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>}
