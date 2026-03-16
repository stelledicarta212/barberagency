# Landing

## Objetivo de este documento

Este archivo no busca explicar lo que ya se hizo antes en el registro de barberia. Su objetivo es dejarle contexto claro a otra IA sobre lo que se quiere construir ahora en la etapa de `landing_plantilla`.

La meta es que otra IA entienda:

- que quiere exactamente el usuario
- como debe sentirse la experiencia
- que partes son obligatorias
- que partes deben ser compartidas
- como se debe implementar sin romper el flujo de reservas

## Vision general

Despues de crear la barberia, el usuario no debe quedar en un simple mensaje de exito. Debe pasar a una segunda etapa donde construye su web de reservas.

Esa etapa no es para crear la barberia ni para configurar datos administrativos. Esa etapa es exclusivamente para:

- elegir una plantilla visual
- personalizar la marca
- definir colores
- subir logo
- ajustar textos
- escoger imagenes
- ver un preview grande en vivo
- publicar una landing atractiva que convierta reservas

La idea es que el usuario sienta que esta creando su pagina comercial, no rellenando otro formulario tecnico.

## Resultado que se quiere lograr

La experiencia deseada es esta:

1. El usuario termina de crear su barberia.
2. Ve dos botones:
   - `Editar`
   - `Ir a crear mi web de reservas`
3. Si pulsa `Ir a crear mi web de reservas`, entra a una pantalla donde ve 4 plantillas visuales.
4. Cada plantilla se muestra como una card grande, atractiva y facil de comparar.
5. Cuando el usuario abre una plantilla, entra a un editor tipo builder.
6. En el editor ve:
   - izquierda: panel de configuracion
   - derecha: preview grande
7. A medida que cambia logo, colores, tipografia o textos, el preview debe actualizarse.
8. Al final guarda y publica su landing.

## Como debe verse la experiencia

### Pantalla 1. Selector de plantillas

Debe verse como una galeria visual.

No debe parecer:

- un formulario
- una tabla
- una lista tecnica

Debe parecer:

- una seleccion de diseños
- una grilla de plantillas
- una experiencia estilo builder comercial

Cada card debe mostrar:

- preview grande
- nombre de la plantilla
- descripcion corta
- etiqueta visual si hace falta
- accion clara para seleccionarla

### Pantalla 2. Editor de plantilla

Debe verse como una experiencia tipo:

- panel lateral izquierdo
- preview grande a la derecha

El panel izquierdo debe ser simple de entender. No queremos una pared de inputs sin orden.

Debe estar organizado por bloques.

## Que debe poder configurar el usuario

### 1. Marca

- logo
- ancho del logo
- tipografia
- estilo visual general

Requisito adicional obligatorio:

- el logo no debe guardarse como binario dentro del payload final
- el logo debe subirse y persistirse como URL
- el usuario debe poder cargarlo con boton normal o con `drag and drop`
- una vez subido, el sistema debe devolver una URL publica o utilizable
- esa URL es la que debe guardarse en la configuracion de branding

### 2. Colores

- color primario
- color secundario
- color de fondo
- color de superficie
- color del texto

### 3. Hero principal

- badge
- titulo principal
- subtitulo
- CTA
- imagen principal

### 4. Contenido visual

- imagen secundaria
- imagen terciaria
- textos de beneficios
- navegacion visible
- nota del footer

Requisito adicional obligatorio:

- las imagenes de hero y apoyo tambien deben poder subirse
- la carga debe permitir `drag and drop`
- el resultado final que se guarda debe ser una URL
- no se deben guardar blobs o base64 como fuente persistente final

### 5. Reservas

- titulo del bloque de reservas
- subtitulo del bloque de reservas
- CTA final

### 6. Ubicacion y contacto

- direccion
- telefono
- ciudad
- mapa o enlace a Google Maps

## Requisito clave del proyecto

Hay un punto obligatorio:

- el formulario de reservas debe ser el mismo para todas las plantillas

Eso significa:

- una sola logica de reserva
- una sola conexion a la BD
- una sola validacion
- un solo flujo real de agenda

Lo visual puede cambiar.

Lo funcional no debe duplicarse.

## Que debe ser compartido entre todas las plantillas

Estas piezas deben ser comunes:

- formulario de reservas
- mapa de ubicacion
- horarios
- servicios
- datos de contacto
- CTA de reserva

La diferencia entre plantillas debe estar en:

- layout
- orden de secciones
- jerarquia visual
- colores
- tipografia
- estilo del hero

No en la logica del negocio.

## Requisito de carga de archivos

Este es el contexto real que debe seguir otra IA para el manejo de imagenes en la etapa de landing.

### Arquitectura

- PostgreSQL -> base de datos
- PostgREST -> API
- n8n -> automatizaciones
- WordPress + Elementor -> frontend y Media Library
- Hostinger / EasyPanel -> infraestructura

El sistema es multi-tenant. Cada barberia tiene sus propios datos, su propio slug y sus propios assets.

### Regla central

Las imagenes no se guardan en PostgreSQL como archivo.

Solo se guarda la URL.

Las imagenes se almacenan en WordPress Media Library.

### UX obligatoria

La UI de branding debe permitir subir archivos de esta forma:

- click para seleccionar archivo
- `drag and drop`
- preview inmediato
- reemplazar imagen
- eliminar imagen si hace falta

### Flujo correcto de imagenes

```txt
Usuario sube logo o imagen
        ↓
El front permite click o drag and drop
        ↓
n8n recibe el archivo
        ↓
n8n sube la imagen a WordPress Media API
        ↓
WordPress la guarda en /wp-content/uploads
        ↓
WordPress devuelve una URL final
        ↓
n8n / backend guarda esa URL en PostgreSQL
```

### Ejemplo de URL esperada

```txt
https://barberagency.com/wp-content/uploads/2026/03/logo-barberia.png
```

### Donde deben guardarse las URLs

#### En datos base de barberia

- `barberia.logo_url`
- `barberia.cover_url`

#### En branding de landing

- `branding.hero_image_url`
- `branding.image_secondary_url`
- `branding.image_tertiary_url`

### Regla tecnica obligatoria

La persistencia final no debe usar:

- `File`
- `Blob`
- base64 dentro del JSON
- binario serializado en el draft

La persistencia final siempre debe ser URL.

### Que debe entender otra IA

Hay que separar dos pasos:

1. subir archivo
2. guardar URL resultante en branding o barberia

No debe mezclarse el upload binario con el guardado final como si fueran la misma cosa.

### Estructura esperada en BD para imagenes base

Tabla:

```sql
barberias
```

Columnas relevantes:

```sql
logo_url TEXT
cover_url TEXT
```

Ejemplo:

```txt
id: 12
nombre: Elite Cuts
logo_url: https://barberagency.com/wp-content/uploads/2026/03/elite-logo.png
cover_url: https://barberagency.com/wp-content/uploads/2026/03/elite-cover.jpg
```

### Contexto de QR

Cada barberia debe tener una landing de reservas con su URL propia.

Ejemplo:

```txt
https://elitecuts.barberagency.com/reservar
```

### Flujo correcto del QR

```txt
Barberia se registra
        ↓
n8n crea slug unico
        ↓
se genera URL de reservas
        ↓
n8n usa API de QR
        ↓
se genera imagen QR
        ↓
se guarda imagen QR
        ↓
se guarda URL del QR en PostgreSQL
```

### Campos relevantes para QR

Tabla:

```sql
barberias
```

Columnas:

```sql
slug TEXT
qr_url TEXT
```

Ejemplo:

```txt
id: 12
nombre: Elite Cuts
slug: elitecuts
logo_url: https://barberagency.com/wp-content/uploads/2026/03/elite-logo.png
qr_url: https://barberagency.com/storage/qrs/elitecuts.png
```

### Funcionamiento del QR

Contenido del QR:

```txt
https://elitecuts.barberagency.com/reservar
```

Flujo del cliente:

```txt
Cliente escanea QR
        ↓
abre landing
        ↓
agenda cita
        ↓
datos se guardan en PostgreSQL
```

### Resumen operativo

#### Imagenes

```txt
Imagen -> WordPress Media
       -> URL
       -> URL guardada en PostgreSQL
```

#### QR

```txt
URL de reservas -> QR
                -> imagen QR
                -> URL guardada en PostgreSQL
```

### Regla final para otra IA

Si implementa logo, hero o imagenes secundarias, debe asumir esto:

- se suben con click o `drag and drop`
- se almacenan en WordPress Media
- el backend obtiene una URL final
- lo unico que se persiste en BD es esa URL
- el mismo criterio aplica para el QR

## Que no queremos hacer

No queremos:

- 4 formularios distintos
- 4 lógicas distintas de reserva
- 4 integraciones distintas a BD
- 4 mapas implementados por separado
- 4 landings totalmente independientes

Eso seria mas costoso, mas fragil y mas dificil de mantener.

## Propuesta funcional de las 4 plantillas

### 1. Classic Barber

Enfoque:

- barberia tradicional
- imagen elegante y clara
- estructura facil de navegar

Sensacion:

- confiable
- sobria
- profesional

### 2. Urban Fade

Enfoque:

- barberias modernas
- publico joven
- imagen con mas energia

Sensacion:

- urbana
- actual
- fuerte visualmente

### 3. Premium Lounge

Enfoque:

- experiencia premium
- mayor valor percibido
- visual mas refinado

Sensacion:

- lujo
- detalle
- posicionamiento alto

### 4. Fast Booking

Enfoque:

- conversion directa
- reserva rapida
- CTA arriba

Sensacion:

- simple
- rapida
- centrada en vender reservas

## Como lo vamos a construir

La implementacion debe dividirse en capas claras.

### Capa 1. Selector de plantillas

Se construye una pantalla con 4 cards grandes.

Cada card representa una plantilla distinta.

Accion esperada:

- seleccionar plantilla
- guardar `template_id`
- pasar al editor

### Capa 2. Editor de branding

Se construye una pantalla con:

- panel izquierdo de controles
- preview en vivo a la derecha

El panel izquierdo se organiza por grupos:

1. Marca
2. Colores
3. Hero
4. Contenido
5. Reservas
6. Ubicacion

### Capa 3. Preview vivo

El preview debe cambiar al instante cuando el usuario:

- cambia logo
- cambia paleta
- cambia textos
- cambia imagenes
- cambia tipografia

La idea no es un preview miniatura. Debe sentirse suficientemente real como para que el usuario entienda como quedara publicada su landing.

### Capa 4. Persistencia

Al guardar, debe persistirse una configuracion de branding de la barberia.

Esa configuracion debe incluir al menos:

- plantilla elegida
- paleta
- textos
- imagenes
- CTA
- datos visuales del hero
- configuracion del bloque de reservas

### Capa 5. Render publico

La landing publica debe leer esa configuracion y mostrar el diseño final segun la plantilla elegida.

La regla es:

- diferentes plantillas
- misma logica de reservas

## Datos que deben llegar desde el onboarding

Cuando el usuario entra a la etapa de landing, no deberiamos pedir otra vez lo que ya se capturo en el onboarding.

La etapa de landing debe arrancar con una base ya cargada.

Datos que deben venir:

- id de barberia
- slug
- nombre
- ciudad
- direccion
- telefono
- timezone
- servicios
- horarios
- barberos

Esos datos sirven para:

- mostrar preview real
- poblar servicios
- poblar contacto
- poblar ubicacion
- no repetir pasos al usuario

## Herencia de datos desde onboarding

Esta parte debe quedar clara para otra IA:

Si, la landing del cliente debe heredar los datos base que ya fueron capturados en el onboarding.

### Que SI debe heredarse automaticamente

- `nombre`
- `slug`
- `ciudad`
- `direccion`
- `telefono`
- `servicios`
- `horarios`
- `barberos`

### Ejemplo concreto: mapa

La direccion del negocio debe heredarse.

Eso significa:

- si en onboarding se capturo `barberia.direccion`
- esa direccion debe llegar a la etapa de landing
- el editor debe usarla como base del bloque de ubicacion
- el mapa o el enlace a Google Maps deben salir de esa informacion

La landing no deberia obligar al usuario a volver a escribir la direccion desde cero.

### Que NO debe heredarse como version final

Estos valores no deben tomarse como definitivos desde onboarding, porque pertenecen a la etapa de branding:

- logo final
- colores finales
- tipografia final
- imagen hero final
- imagenes secundarias finales
- textos comerciales finales
- CTA final

Eso se define en `landing_plantilla`.

### Lo que NO esta pendiente conceptualmente

Ya esta decidido a nivel de producto que:

- la landing debe arrancar con datos base heredados
- la direccion debe poder usarse en el mapa
- servicios y horarios deben llegar precargados
- la personalizacion visual ocurre despues

### Lo que SI esta pendiente de implementacion

Todavia hay que asegurar en codigo que:

1. la etapa de landing lea correctamente los datos heredados
2. el bloque de ubicacion use `direccion` y `ciudad` como base
3. el mapa genere embed o enlace real a Google Maps
4. los servicios heredados se reflejen en preview y en landing final
5. los horarios heredados se reflejen en preview y en landing final
6. la UI deje claro que esos datos vienen del onboarding pero se pueden ajustar si hace falta

### Regla para otra IA

Otra IA no debe asumir que la landing empieza vacia.

Debe asumir que:

- la landing empieza con datos operativos heredados
- el usuario completa encima el branding visual
- el mapa y el bloque de contacto deben nacer de esos datos heredados
- la reserva sigue conectada a la misma barberia y a la misma BD

## Datos de branding que debemos guardar

El modelo de branding debe poder representar al menos esto:

```json
{
  "template_id": "classic",
  "template_name": "Classic Barber",
  "theme_mode": "dark",
  "color_primary": "#111827",
  "color_secondary": "#F59E0B",
  "color_background": "#FFFFFF",
  "color_surface": "#F4F4F5",
  "color_text": "#111827",
  "cta_label": "Reservar cita",
  "logo_width": 110,
  "font_pair": "Sora + Manrope",
  "nav_items": ["Inicio", "Servicios", "Equipo", "Reservar"],
  "hero_badge": "RESERVA ONLINE",
  "hero_title": "Agenda tu cita en minutos",
  "hero_subtitle": "Disponibilidad real para tu barberia.",
  "booking_title": "Reserva ahora",
  "booking_subtitle": "Tu cita queda confirmada al instante.",
  "benefit_1": "Mas orden",
  "benefit_2": "Mas reservas",
  "benefit_3": "Mejor imagen",
  "footer_note": "Landing lista para publicar.",
  "hero_image_url": "",
  "image_secondary_url": "",
  "image_tertiary_url": "",
  "map_enabled": true,
  "google_maps_url": ""
}
```

## Orden recomendado de implementacion

### Fase 1

Construir la pantalla visual con 4 plantillas.

Objetivo:

- seleccionar una plantilla
- guardar esa decision

### Fase 2

Construir el editor con panel izquierdo + preview derecho.

Objetivo:

- cambiar logo
- paleta
- tipografia
- hero
- CTA
- agregar zonas de carga con `drag and drop`
- guardar logo e imagenes como URL

### Fase 3

Conectar datos base del negocio al preview.

Objetivo:

- nombre real
- servicios reales
- direccion real
- telefono real

### Fase 4

Integrar mapa y formulario de reservas como bloques compartidos.

Objetivo:

- que las 4 plantillas usen la misma base funcional

### Fase 5

Persistir la configuracion final y publicar la landing.

Objetivo:

- que el usuario guarde
- vea su landing final
- y pueda empezar a recibir reservas
- con logo e imagenes ya persistidas como URL

## Criterios de aceptacion

La etapa de landing se considera bien implementada si cumple esto:

1. El usuario ve 4 plantillas claras y visuales.
2. Puede escoger una facilmente.
3. Puede editar logo, colores, textos e imagenes.
4. Puede subir logo e imagenes con `drag and drop`.
5. Logo e imagenes quedan guardados como URL.
6. Ve preview grande en vivo.
7. El formulario de reservas es unico para todas.
8. El mapa forma parte de la landing.
9. La landing final conserva identidad visual distinta por plantilla.
10. La logica de reserva sigue siendo una sola.
11. Todo queda conectado a la misma BD.

## Decision de diseño recomendada

La mejor decision para este proyecto es:

- 4 estilos visuales
- 1 sola base funcional
- 1 solo formulario de reservas
- 1 solo bloque de mapa
- 1 sola estructura de datos de branding

Eso da:

- velocidad
- menos bugs
- mantenimiento mas simple
- coherencia entre plantillas

## Resumen ejecutivo

Lo que se quiere construir ahora no es otra pantalla administrativa, sino un creador de landing para barberias. Debe arrancar con una galeria de 4 plantillas visuales y continuar con un editor tipo builder. El usuario debe poder personalizar su marca y ver el resultado en tiempo real. El formulario de reservas y el mapa deben ser compartidos entre todas las plantillas para no duplicar la logica del negocio ni romper la conexion con la BD.
