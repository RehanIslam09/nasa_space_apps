# Frontend & React Guidelines

## 1. Next.js App Router Architecture

- **Server Components by Default**: Treat every component inside `src/app/` as a React Server Component (RSC) unless interactivity, client hooks (`useState`, `useEffect`), browser APIs (`window`, `document`), or canvas rendering are required.
- **Client Component Boundary**: Push `'use client'` as far down the component tree as possible. Keep layouts and page skeletons as Server Components for faster TTFB and zero JS overhead.
- **Data Fetching**:
  - Prefer fetching initial data directly in Server Components using Drizzle ORM or server-side Supabase client.
  - Use TanStack Query (`@tanstack/react-query`) in Client Components for dynamic client-side fetching, polling, mutations, and cache management.

## 2. Animation & 3D Experiences

- **WebGL / Three.js Isolation**:
  - All `@react-three/fiber` and Three.js components must be isolated in `'use client'` components.
  - Dynamically load heavy 3D canvas modules using `next/dynamic` with `{ ssr: false }` to avoid SSR hydration mismatches and minimize initial bundle size.
  - Clean up geometry, textures, and animation frames on unmount.
- **GSAP & ScrollTrigger**:
  - Always use `@gsap/react`'s `useGSAP()` hook for automatic scoping and garbage collection.
  - Synchronize Lenis smooth scrolling with GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)` and `gsap.ticker`.
  - Disable heavy scroll effects on mobile/touch devices or provide reduced-motion fallbacks (`prefers-reduced-motion`).

## 3. Styling & Design System

- **Tailwind CSS 4**:
  - Utilize Tailwind utility classes for layout, typography, and responsive design.
  - Configure theme tokens using CSS variables inside `globals.css` with OKLCH color definitions.
  - Use `cn()` helper (`clsx` + `tailwind-merge`) when conditionally composing class names.
  - Do NOT create arbitrary CSS files or inline style objects unless calculating dynamic transform matrices.
