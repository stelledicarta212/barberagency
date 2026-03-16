---
name: landing-plantilla
description: Use when building, improving, or fixing the BarberAgency landing template flow after onboarding, including 4-template selector UX, branding editor, shared booking/map blocks, image upload via drag-and-drop, and URL-based persistence to PostgreSQL through n8n + WordPress Media.
---

# Landing Plantilla

Use this skill for any request related to `landing_plantilla`, visual template selection, branding customization, and public landing rendering for barberias.

## Scope

This skill covers:

- 4 visual template selector
- branding editor with live preview
- shared booking form for all templates
- shared map block for all templates
- image handling (logo/hero/secondary/tertiary)
- data inheritance from onboarding
- persistence contract (PostgreSQL + PostgREST + n8n + WordPress Media)
- SEO setup for public landing pages

This skill does not cover:

- onboarding creation flow itself
- unrelated auth/session issues
- destructive infrastructure changes

## Non-negotiable rules

1. Use one booking flow for all templates.
2. Do not create one booking implementation per template.
3. Images are persisted as URLs, not binaries/base64.
4. Upload UX must support click + drag and drop.
5. Landing starts with inherited business data from onboarding.
6. SEO setup must be template-aware but data-driven from the same source of truth.

## Product intent

After onboarding success, the user goes to landing setup and must:

1. choose one of 4 visual templates
2. customize logo/colors/typography/text/images
3. preview changes live
4. publish landing that keeps the same reservation backend

## Required UX

### Screen A: Template selector

- 4 large visual cards
- clear template name and short subtitle
- direct action to select template

### Screen B: Branding editor

- left panel with controls
- right side large live preview
- instant visual feedback on edits

### Editor sections

- Brand: logo, logo width, font pair
- Colors: primary, secondary, background, surface, text
- Hero: badge, title, subtitle, CTA, hero image
- Content: nav items, benefits, footer note, support images
- Booking: title/subtitle/CTA text
- Location: address, city, phone, map link/embed source

## Shared blocks policy

Keep these blocks reusable across all templates:

- `BookingForm`
- `MapSection`
- `ServicesSection`
- `BarbersSection`
- `ContactSection`
- `FooterSection`

Templates can change layout and style only.

## Inherited data policy

Landing must start with onboarding data already captured:

- `barberia.id`
- `slug`
- `nombre`
- `ciudad`
- `direccion`
- `telefono`
- `servicios`
- `horarios`
- `barberos`

Do not ask the user to re-enter base business data.

## Image + QR persistence contract

Read [references/persistence-contract.md](references/persistence-contract.md) before implementing uploads.

Hard rules:

- files are uploaded through n8n to WordPress Media
- WordPress returns URL
- backend persists URL in PostgreSQL
- no base64/blob persistence in final payload

Core URL fields:

- `barberia.logo_url`
- `barberia.cover_url`
- `branding.hero_image_url`
- `branding.image_secondary_url`
- `branding.image_tertiary_url`
- `barberia.qr_url`

## SEO contract

Read [references/seo-playbook.md](references/seo-playbook.md) before implementing or changing landing SEO.

Hard SEO rules:

- each public landing must have unique title, description, canonical, and OG tags
- `slug` is the URL identity and must stay stable once published
- map/location data must be reflected in LocalBusiness schema
- image metadata (hero/logo) must use real public URLs
- no-index only for draft/private pages, never for published public landing

## Implementation workflow

1. Confirm current UX target: selector + editor + publish.
2. Keep booking/map components shared.
3. Implement or refine drag-and-drop upload zones.
4. Ensure upload output is URL and mapped to the correct fields.
5. Keep onboarding inheritance wired into initial landing state.
6. Persist branding and verify public landing render.
7. Validate with acceptance checklist.

## Acceptance checklist

Use [references/acceptance-checklist.md](references/acceptance-checklist.md) for final verification.

Minimum pass criteria:

- 4 template cards visible
- editor panel + live preview works
- booking flow remains shared
- map uses inherited address
- uploads support drag and drop
- final persistence uses URL fields only
