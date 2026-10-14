---
version: alpha
name: prophunta-ai
description: Design language and token system for PropHunta AI real estate verification, property discovery, and Nigerian real estate trust infrastructure.
colors:
  primary: hsl(84 81% 34%)
  primary-foreground: hsl(0 0% 100%)
  secondary: hsl(210 40% 96.1%)
  secondary-foreground: hsl(222.2 47.4% 11.2%)
  background: hsl(210 40% 98%)
  foreground: hsl(222.2 84% 4.9%)
  muted: hsl(210 40% 96.1%)
  muted-foreground: hsl(215.4 16.3% 46.9%)
  accent: hsl(84 48% 93%)
  accent-foreground: hsl(84 85% 22%)
  destructive: hsl(0 84.2% 60.2%)
  destructive-foreground: hsl(210 40% 98%)
  border: hsl(214.3 31.8% 91.4%)
  input: hsl(214.3 31.8% 91.4%)
  ring: hsl(84 81% 34%)
typography:
  sans:
    fontFamily: Plus Jakarta Sans, Inter, sans-serif
  body:
    fontFamily: Plus Jakarta Sans, Inter, sans-serif
  headline:
    fontFamily: Plus Jakarta Sans, sans-serif
rounded:
  base: 0.75rem
---

## Overview

PropHunta AI is an institutional-grade Nigerian real estate trust and property discovery platform. Its visual design direction combines high-contrast modern editorial layouts, dark slate chrome accents, and vibrant lime/emerald security indicators to convey institutional authority, verified title integrity, and radical anti-fraud transparency.

## Colors

The palette is built around trustworthy dark neutrals, luminous lime and emerald accents, and crisp card backgrounds:

- **Primary**: Deep energetic lime (`hsl(84 81% 34%)`) paired with high-contrast white text for trust badges, primary search actions, and affirmative status indicators.
- **Accents**: Subtle lime tint (`hsl(84 48% 93%)`) and intense emerald borders for verified credential badges and LASRERA compliance cards.
- **Neutrals**: Crisp slate-950 (`#080d09` / `#0c140d`) used for hero backdrops, app headers, and sticky sidebars; clean white and slate-50 used for client dashboard surfaces.
- **Destructive**: Deep crimson (`hsl(0 84.2% 60.2%)`) reserved for revoked verifications, rejected titles, or cancelled bookings.

## Themes

| Token | Light Mode (Default) | Dark Mode |
| :--- | :--- | :--- |
| `background` | `hsl(210 40% 98%)` | `hsl(222.2 84% 4.9%)` |
| `foreground` | `hsl(222.2 84% 4.9%)` | `hsl(210 40% 98%)` |
| `card` | `hsl(0 0% 100%)` | `hsl(222.2 84% 4.9%)` |
| `primary` | `hsl(84 81% 34%)` | `hsl(84 85% 48%)` |
| `secondary` | `hsl(210 40% 96.1%)` | `hsl(217.2 32.6% 17.5%)` |
| `muted` | `hsl(210 40% 96.1%)` | `hsl(217.2 32.6% 17.5%)` |
| `border` | `hsl(214.3 31.8% 91.4%)` | `hsl(217.2 32.6% 17.5%)` |
| `ring` | `hsl(84 81% 34%)` | `hsl(84 85% 48%)` |

## Typography

Typography uses **Plus Jakarta Sans** across headlines, interactive elements, and running copy:

- **Headlines (`font-headline`)**: Geometric, confident letterforms with negative tracking (`tracking-tight`) for high-impact section titles and dashboard stat headers.
- **Body (`font-body` / `font-sans`)**: Highly legible sans-serif with generous line heights (`leading-relaxed`) and crisp contrast against light backgrounds.
- **Monospace (`font-mono`)**: Used specifically for Nigerian Naira financial numbers (`₦`), cadastral coordinates, transaction hashes, and verification checksum tokens.

## Layout

- **Container Constraints**: Maximum width of `1280px` (`max-w-7xl`) for dashboard pages and landing sections, centered with standard horizontal padding (`px-4 sm:px-6 lg:px-8`).
- **Sidebar & App Shell**: Fixed 64px width on desktop (`w-64`) with backdrop blur and `#0c140d` dark tone; main content area flows with `space-y-6`.
- **Responsive Grids**: Single-column layout on mobile (<640px), 2-column layout on tablet (640px–1024px), and 3-to-4 column responsive grid on desktop (>1024px).
- **Safe Area Insets**: All sticky action bars and mobile bottom navigations incorporate `env(safe-area-inset-bottom)`.

## Elevation & Depth

- **Cards & Surface Elevation**: Subtle shadows (`shadow-xs` / `shadow-sm`) paired with explicit 1px borders (`border-slate-200/90`) rather than heavy drop shadows.
- **Backdrop Blurs**: Translucent glass layers (`backdrop-blur-md` to `backdrop-blur-xl`) for sticky headers, modal dialogs, and verification badges.
- **Micro-Gradients**: Subtle radial background gradients in dark chrome to eliminate flat digital grayness.

## Shapes

- **Border Radius**: Global base radius of `0.75rem` (`rounded-xl` to `rounded-2xl` on cards; `rounded-full` for pill badges, avatar containers, and filter chips).
- **Interactive Controls**: Buttons use `rounded-xl` or `rounded-lg` with minimum 44px touch targets on mobile viewports.

## Components

- **Trust & Verification Badges**: Distinctive shield-shaped icons with lime/emerald badge containers, displaying explicit tier ratings (e.g. `Tier 1 Verified Seeker`, `LASRERA Compliant`).
- **Property Cards**: Clean photo ratios, price formatted prominently in Nigerian Naira (`₦`), inspection badges, and interactive favorite toggles.
- **Search Modules**: Multi-tiered segment controls with sticky filtering bars and quick location suggestions.

## Do's and Don'ts

### Do's
- Format all Nigerian currency figures with the official `₦` symbol and comma separation (e.g., `₦ 4,500,000/yr`).
- Surface trust verification indicators prominently next to user profiles and property listings.
- Maintain minimum touch target size of 44x44px for all mobile interactive elements.
- Anchor account verification credentials directly within the user's account profile.

### Don'ts
- Do not use generic placeholder ratings (e.g. 5-star fake stars) on unverified real estate listings.
- Do not place multiple competing primary green buttons in the same card view.
- Do not hide verification or regulatory credentials behind obscure submenus.
- Do not use low-contrast text against dark hero backgrounds without proper drop-shadow or text-shadow protection.
