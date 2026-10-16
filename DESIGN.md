---
version: 1.0.0
name: prophunta-ai
description: Institutional-grade PropTech design language blending Airbnb discovery polish with Stripe/Linear operational clarity.
colors:
  canvas: '#F8FAFC'
  card: '#FFFFFF'
  border: 'rgba(226, 232, 240, 0.8)'
  primary: '#0F172A'
  primary-foreground: '#FFFFFF'
  emerald-trust: '#059669'
  amber-pending: '#D97706'
  rose-flag: '#E11D48'
typography:
  sans: Plus Jakarta Sans, Inter, sans-serif
  tabular-nums: true
rounded:
  cards: 1rem (rounded-2xl)
  controls: 0.75rem (rounded-xl)
  badges: 9999px (rounded-full)
---

## Overview

PropHunta AI is an institutional-grade Nigerian real estate trust and property discovery platform. Its visual design direction blends Airbnb's visual discovery polish with Stripe and Linear's operational dashboard clarity:

- **Canvas Background**: Pristine `#F8FAFC` (`bg-slate-50`) for main app backgrounds; pure `#FFFFFF` (`bg-white`) for elevated cards and surfaces.
- **Borders & Dividers**: Crisp `1px` borders using `border-slate-200/80` (dark mode: `border-slate-800`).
- **Primary Action / Brand**: Deep Architectural Slate (`bg-slate-900 text-white hover:bg-slate-800`).
- **Trust & Verification Accent**: PropTech Emerald (`bg-emerald-600`, soft badge: `bg-emerald-50 text-emerald-700 border-emerald-200`). Used strictly for Verified Properties, Active Leases, Escrow Protection, and AI Match Scores.
- **Warning / Pending**: Warm Amber (`bg-amber-50 text-amber-700 border-amber-200`) for pending inspections, unverified documents, or escrow holds.
- **Danger / Governance Flag**: Rose (`bg-rose-50 text-rose-700 border-rose-200`) for rejected properties, overdue rent, or compliance flags.

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
