"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import * as React from "react"

// Using `any` to bypass the broken type-checking from the next-themes package
export function ThemeProvider({ children, ...props }: { children: React.ReactNode; [key: string]: any }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
 