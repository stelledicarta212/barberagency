# Persistence Contract (Images, QR, DB)

## Architecture

- PostgreSQL: source of truth for business and landing metadata
- PostgREST: data API
- n8n: automation bridge
- WordPress Media Library: image storage
- EasyPanel/Hostinger: runtime infra

## Principle

Images are not persisted as file blobs in PostgreSQL.

Only URLs are persisted.

## Upload flow

```txt
User selects or drags image
        ->
Frontend upload request
        ->
n8n receives file
        ->
n8n uploads to WordPress Media API
        ->
WordPress stores in /wp-content/uploads
        ->
WordPress returns final URL
        ->
Backend saves URL in PostgreSQL
```

## Required upload UX

- click-to-upload
- drag-and-drop
- immediate preview
- replace existing image
- clear/remove image

## URL fields

### Base profile

- `barberia.logo_url`
- `barberia.cover_url`
- `barberia.slug`
- `barberia.qr_url`

### Landing branding

- `branding.hero_image_url`
- `branding.image_secondary_url`
- `branding.image_tertiary_url`

## QR flow

```txt
Slug created
      ->
Public booking URL created
      ->
QR generated
      ->
QR image URL persisted
```

QR content should resolve to booking landing, e.g.:

`https://{slug}.{base-domain}/reservar`

## Map inheritance

`direccion` and `ciudad` inherited from onboarding are the default source for map/location section.

Map section must be prefilled from inherited values.

## Hard anti-patterns

Do not persist:

- base64 image payloads
- raw browser File objects
- binary blobs in JSON

Do not split booking logic per template.

