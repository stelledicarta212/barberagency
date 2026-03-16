# Acceptance Checklist

Use this checklist before considering a landing-plantilla task done.

## A. Template selector

- [ ] 4 visual template cards are rendered.
- [ ] Each card has name + subtitle + select action.
- [ ] Selected template is persisted as `template_id`.

## B. Branding editor

- [ ] Left configuration panel is usable on desktop and mobile.
- [ ] Right live preview updates after each change.
- [ ] Brand controls work: logo, logo width, font pair.
- [ ] Palette controls work: primary/secondary/background/surface/text.
- [ ] Hero controls work: badge/title/subtitle/CTA/images.

## C. Inherited business data

- [ ] `nombre`, `slug`, `ciudad`, `direccion`, `telefono` are preloaded.
- [ ] `servicios`, `horarios`, `barberos` are available for rendering.
- [ ] Map defaults to inherited location data.

## D. Images and upload

- [ ] Upload supports click.
- [ ] Upload supports drag-and-drop.
- [ ] Upload returns URL and UI stores URL field.
- [ ] No base64/blob persisted as final value.
- [ ] URL fields are filled correctly:
- [ ] `barberia.logo_url`
- [ ] `barberia.cover_url` or mapped hero cover
- [ ] `branding.hero_image_url`
- [ ] `branding.image_secondary_url`
- [ ] `branding.image_tertiary_url`

## E. Booking and map shared logic

- [ ] One booking form logic is reused across all templates.
- [ ] One map block logic is reused across all templates.
- [ ] Template changes only affect visual layout/style.

## F. Persistence and public render

- [ ] Branding payload is persisted successfully.
- [ ] Public landing endpoint returns expected branding values.
- [ ] Public landing reflects selected template and palette.
- [ ] Reservation submission still writes to the same backend/DB flow.

## G. SEO

- [ ] Unique title per barberia landing.
- [ ] Unique meta description per barberia landing.
- [ ] Canonical URL is present and correct.
- [ ] OG/Twitter tags are present and use public image URL.
- [ ] LocalBusiness (or HairSalon) JSON-LD is present and valid.
- [ ] Location data in schema matches inherited `direccion` and `ciudad`.
- [ ] Published landing is `index,follow`.

## H. Regression checks

- [ ] Existing onboarding completion flow still works.
- [ ] "Editar" and "Ir a crear mi web de reservas" post-success actions still work.
- [ ] No CORS regression on onboarding complete endpoint.
