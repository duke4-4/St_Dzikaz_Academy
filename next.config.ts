import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const makePublicPreviewOrigin = (() => {
  const publicURL = process.env.FIGMA_PUBLIC_URL
  if (!publicURL) return undefined

  try {
    // Next.js expects host[:port] entries rather than full URL origins.
    return new URL(publicURL).host
  } catch {
    return undefined
  }
})()

const nextConfig: NextConfig = {
  trailingSlash: true,
  turbopack: {
    root: path.resolve(dirname),
  },
  // Allow the cross-origin Figma Make preview during development.
  allowedDevOrigins: makePublicPreviewOrigin ? [makePublicPreviewOrigin] : [],
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.FIGMA_PUBLIC_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  },
}

export default nextConfig
