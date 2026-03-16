# SEO Playbook for Landing Plantilla

Use this playbook when implementing SEO for public barberia landing pages.

## SEO goals

1. Rank landing pages for local-intent searches.
2. Improve CTR with relevant snippets.
3. Keep SEO consistent across all 4 templates.
4. Avoid duplicate metadata between barberias.

## Source of truth

Use inherited and persisted business data:

- `nombre`
- `slug`
- `ciudad`
- `direccion`
- `telefono`
- `servicios`
- `logo_url`
- `cover_url`
- `branding.hero_image_url`

Do not hardcode SEO text globally for all barberias.

## Required per-page metadata

Each public landing must include:

- unique `<title>`
- unique `<meta name="description">`
- canonical URL
- robots directive
- Open Graph tags
- Twitter Card tags

## Metadata templates

### Title template

`{nombre} | Reserva Barberia en {ciudad}`

Fallback:

`{nombre} | Reserva tu cita`

### Description template

`Reserva en {nombre} en {ciudad}. {servicio_principal} y mas servicios con agenda online.`

If no service exists:

`Reserva en {nombre} en {ciudad} con agenda online y confirmacion rapida.`

### Canonical

Use the exact public URL for the slug:

`https://{slug}.{base-domain}/reservar`

or your configured public route equivalent.

## Open Graph and Twitter

Required:

- `og:title`
- `og:description`
- `og:type=website`
- `og:url`
- `og:image`
- `twitter:card=summary_large_image`
- `twitter:title`
- `twitter:description`
- `twitter:image`

Image priority:

1. `branding.hero_image_url`
2. `cover_url`
3. safe default image

## Structured data (JSON-LD)

Use `LocalBusiness` (or subtype `HairSalon` where applicable).

Minimum fields:

- `@context`
- `@type`
- `name`
- `url`
- `image`
- `telephone`
- `address`
- `areaServed` (city)

Address should use inherited `direccion` + `ciudad`.

If coordinates are available later, add `geo`.

## Content SEO blocks

Each template can vary in design, but keep these content blocks indexable:

- H1 with brand + service intent
- short local-intent intro paragraph
- services section with crawlable text
- location/contact section with plain text address
- booking CTA text in normal HTML (not only canvas/image)

## URL and slug rules

- slug must be lowercase and normalized
- avoid changing slug after publication
- if slug changes are unavoidable, keep redirects from old URL

## Robots and indexing rules

- Published public landing: `index,follow`
- Draft/private preview pages: `noindex,nofollow`

Never publish public landing with noindex accidentally.

## Multi-template consistency

Templates can change look and layout, but SEO contract is shared:

- same metadata generation logic
- same schema generation logic
- same canonical policy
- same robots policy

## Technical checks before release

- title length roughly 45-65 chars
- description length roughly 120-160 chars
- exactly one H1
- canonical present and valid
- OG image URL returns 200
- structured data parses without errors
- page is mobile-friendly and fast enough

## Common SEO failures to avoid

- duplicated titles for different barberias
- missing canonical
- OG image broken or private URL
- noindex on production landing
- metadata not using city/location
- JSON-LD with empty fields

