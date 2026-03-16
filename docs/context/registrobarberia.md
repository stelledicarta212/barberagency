# Registro Barberia

## Objetivo de este documento

Este archivo resume de forma completa todo lo que se hizo hasta este punto alrededor del flujo de registro de barberia, el wizard de Elementor, el endpoint de onboarding y la integracion posterior con la pagina `landing_plantilla`.

La idea es dejar trazabilidad tecnica clara de:

- que se queria lograr
- que problemas aparecieron
- que cambios se hicieron en frontend
- que cambios se hicieron en backend
- como se valido en produccion
- que estado final quedo
- que cosas siguen pendientes o separadas del onboarding

## Objetivo funcional del flujo

El flujo buscado quedo definido asi:

1. El usuario completa un wizard en Elementor para crear la barberia.
2. Ese wizard envia un `draft` al endpoint real de onboarding.
3. El backend crea en BD:
   - barberia
   - admin
   - servicios
   - horarios
   - barberos opcionales
4. Al terminar la creacion:
   - no se debe redirigir automaticamente
   - deben aparecer 2 botones:
     - `Editar`
     - `Ir a crear mi web de reservas`
5. Si el usuario pulsa `Ir a crear mi web de reservas`, debe ir a:
   - `https://barberagency-barberagency.gymh5g.easypanel.host/landing_plantilla/`
6. Esa siguiente pagina sera la etapa donde se definiran:
   - logo
   - colores
   - fondos
   - textos
   - branding en general

## Contexto del backend real

El endpoint real de onboarding no estaba en este workspace. El archivo real se encontro en:

`C:\Users\calvi\OneDrive\n8n\Visual studio\Barber_Proyect_Agency\app\app\api\onboarding\complete\route.ts`

Ese endpoint ya tenia la logica principal para:

- crear o actualizar usuario admin
- crear barberia
- persistir landing publica basica
- crear servicios
- crear horarios
- crear o sincronizar barberos

## Problemas detectados en el frontend

### 1. Error de inicializacion del wizard

En una version del script se produjo este fallo:

- `normalizeDraft()` usaba `draft` antes de que existiera

Efecto:

- la pantalla quedaba en `Cargando...`
- el script se rompia al arrancar

Correccion aplicada:

- se corrigio la inicializacion para que `draft` se cree antes de ser usado
- se saco la mutacion incorrecta de `draft` dentro de `normalizeDraft()`

### 2. Tema y contraste

El usuario pidio que el wizard:

- respetara el tema global del sitio
- no metiera un sistema de tema aislado
- se viera bien tanto en claro como en oscuro
- tuviera mejor contraste en tema claro

Correcciones aplicadas:

- se adapto el widget para leer el tema global desde `body` y `html`
- se agrego observacion de cambios en `class` y `data-theme`
- se ajusto el CSS para contraste adicional en tema claro
- se centro mejor el bloque principal de conversacion

### 3. Email del admin forzado desde la sesion

Inicialmente se habia planteado bloquear el email del admin con el email de la sesion actual de WordPress.

Luego se aclaro que eso no era correcto porque:

- el admin se crea dentro del onboarding
- el correo del admin debe ser el que se escribe en el formulario
- no debe salir forzado del login previo

Correccion aplicada:

- se elimino el forzado de `admin.email` desde `localStorage` o sesion
- el paso del admin paso a ser un campo manual normal
- el payload final ya usa el correo escrito por el usuario

### 4. Validacion de barberos poco clara

El wizard mostraba un error generico tipo:

- `Cada barbero debe tener nombre, email valido y password minima de 6 caracteres`

Problema:

- no decia cual fila estaba mal

Correccion aplicada:

- se agrego validacion fila por fila
- ahora indica exactamente:
  - que barbero fallo
  - si falta nombre
  - si falta email
  - si el email no es valido
  - si falta password
  - si la password es muy corta

### 5. HTML del wizard borrado accidentalmente

En un punto se pego solo el script y se perdio el contenedor principal del widget.

Efecto:

- desaparecio el wizard
- solo quedo visible el fondo de la pagina

Correccion aplicada:

- se restauro el bloque HTML base del widget
- el selector raiz correcto quedo como:
  - `#baWizardApp`

## Estructura final del frontend del wizard

### Selector principal

El widget trabaja sobre:

- `#baWizardApp`

### Prefijo de clases

Se uso el prefijo:

- `.ba-`

### Separacion de codigo recomendada

Se termino recomendando esta separacion:

1. HTML + JS en widget HTML de Elementor
2. CSS en `CSS adicional`

Esto se recomendo porque:

- es mas facil mantenerlo
- evita romper el widget pegando todo junto
- reduce conflictos de estilos

## Comportamiento final esperado del wizard

### Antes del submit

El usuario completa:

- nombre de barberia
- ciudad
- direccion
- telefono
- slot de agenda
- nombre admin
- email admin
- password admin
- servicios
- horarios
- barberos opcionales
- resumen final

### Al crear la barberia

El wizard:

1. arma el `payload`
2. hace `POST` a:
   - `https://barberagency-app.gymh5g.easypanel.host/api/onboarding/complete`
3. si el backend responde bien:
   - guarda un objeto semilla para la siguiente etapa
   - marca el onboarding como completado
   - vuelve a renderizar la pantalla final
   - muestra el mensaje verde de exito
   - muestra dos botones:
     - `Editar`
     - `Ir a crear mi web de reservas`

### Semilla guardada para la siguiente pagina

Se definio guardar en navegador:

- `sessionStorage`
- clave: `ba_landing_seed`

Contenido aproximado:

```json
{
  "source": "onboarding_complete",
  "created_at": "ISO_DATE",
  "barberia": {
    "id": 123,
    "slug": "mi-barberia",
    "nombre": "Mi Barberia",
    "ciudad": "Bogota",
    "direccion": "Calle 10 #20-30",
    "telefono": "3001234567",
    "timezone": "America/Bogota",
    "slot_min": 15
  },
  "servicios": [],
  "horarios": [],
  "barberos": [],
  "onboarding_result": {}
}
```

### Redireccion posterior

Cuando el usuario pulsa:

- `Ir a crear mi web de reservas`

se redirige a:

- `https://barberagency-barberagency.gymh5g.easypanel.host/landing_plantilla/`

Importante:

- no se redirige automaticamente
- la redireccion solo pasa cuando el usuario lo decide

## Estado de la pagina landing_plantilla

Se acordo que `landing_plantilla` es la etapa donde se definira:

- logo
- colores
- fondo
- identidad visual
- textos comerciales
- imagenes
- branding completo

Se dejo claro que:

- el onboarding no define branding final
- solo deja la base del negocio creada
- la pagina siguiente debe leer `ba_landing_seed` para precargar informacion

Hasta este punto se confirmo que:

- el wizard ya guarda los datos para esa siguiente pagina

Todavia no se documento en este workspace un script final de lectura dentro de `landing_plantilla`. Si esa pagina aun no lo hace, sigue pendiente implementar el lector de:

- `sessionStorage.getItem("ba_landing_seed")`

## Problema critico de backend: CORS

### Sintoma visto en el navegador

El wizard llego a mostrar:

- `Failed to fetch`

Y en consola aparecia:

- bloqueo CORS hacia:
  - `https://barberagency-app.gymh5g.easypanel.host/api/onboarding/complete`

### Causa real

El endpoint no estaba devolviendo correctamente los headers CORS al navegador para el origen:

- `https://barberagency-barberagency.gymh5g.easypanel.host`

### Solucion implementada en el backend

Se modifico `route.ts` para agregar:

1. `OPTIONS`
2. `Access-Control-Allow-Origin`
3. `Access-Control-Allow-Methods`
4. `Access-Control-Allow-Headers`
5. `Access-Control-Allow-Credentials`
6. `Vary: Origin`

### Estrategia usada

Se agregaron estas piezas:

- `DEFAULT_ALLOWED_ORIGINS`
- `getAllowedOrigins()`
- `buildCorsHeaders(request)`
- `mergeHeaders(base, extra)`
- `jsonWithCors(request, body, init)`
- `export async function OPTIONS(request)`

Luego se reemplazaron los `NextResponse.json(...)` del `POST` por `jsonWithCors(...)`.

### Origenes permitidos por fallback

Dentro del codigo se dejo fallback para:

- `https://barberagency-barberagency.gymh5g.easypanel.host`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

### Variable de entorno prevista

Tambien se dejo soporte para:

`ONBOARDING_CORS_ORIGINS`

Valor esperado:

```env
ONBOARDING_CORS_ORIGINS=https://barberagency-barberagency.gymh5g.easypanel.host
```

## Cambio real aplicado en el repositorio del backend

El parche se escribio en el repo real:

`C:\Users\calvi\OneDrive\n8n\Visual studio\Barber_Proyect_Agency\app`

Se dejo copia de respaldo del archivo:

`app/api/onboarding/complete/route.ts.bak_20260314_cors`

Luego se hizo:

- `git add`
- `git commit`
- `git push origin main`

Commit generado:

- `70908c1`

Mensaje:

- `fix: habilitar CORS en onboarding complete`

## Deploy a produccion

Se disparo el deploy mediante el webhook de Easypanel.

La pantalla de Easypanel confirmo un deploy exitoso con el mensaje:

- `Deploy service: fix: habilitar CORS en onboarding complete`

## Validaciones realizadas

### Validacion desde fuera del contenedor

Se probo el endpoint publico con `OPTIONS` y luego con `POST`.

Resultado final correcto:

- `HTTP/1.1 204 No Content` en `OPTIONS`
- headers CORS presentes

Headers confirmados:

```txt
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Origin: https://barberagency-barberagency.gymh5g.easypanel.host
```

En `POST` tambien se valido que el backend respondia con CORS y con JSON de error real cuando el payload era incompleto:

```json
{"ok":false,"message":"Nombre y slug de barberia son obligatorios."}
```

Eso demostro que:

- ya no habia bloqueo por CORS
- el navegador ya podia recibir la respuesta real del backend

### Validacion dentro del contenedor de Easypanel

Se abrio consola del servicio y se ejecuto:

```bash
curl -i -X OPTIONS "http://127.0.0.1:3000/api/onboarding/complete" \
  -H "Origin: https://barberagency-barberagency.gymh5g.easypanel.host" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Resultado correcto:

- `HTTP/1.1 204 No Content`
- `access-control-allow-origin` correcto
- resto de headers CORS correctos

Esto confirmo que:

- la app dentro del contenedor ya estaba sirviendo el endpoint correctamente

## Resultado final validado por el usuario

Se llego a la confirmacion visual de exito en el navegador con el mensaje:

- `Onboarding creado en BD correctamente.`

Eso confirma que el flujo principal de onboarding ya funciona end to end:

- frontend envia
- backend recibe
- BD se actualiza
- respuesta de exito vuelve al navegador

## Hallazgos adicionales no pertenecientes al onboarding

Durante la depuracion de consola aparecieron errores separados del wizard:

1. CORS en el chat de `n8n`
2. `401` en `session/me`

Importante:

- esos errores no pertenecen al endpoint de onboarding
- no se corrigieron dentro de este flujo
- deben tratarse aparte para no mezclar diagnosticos

## Estado actual del proyecto despues de todo lo hecho

### Ya resuelto

- wizard de Elementor conectado al endpoint real
- admin manual, no atado a sesion previa
- validacion mas clara de barberos
- mejor contraste y soporte de tema claro/oscuro
- soporte de tema global del sitio
- bloque de resumen y UX del wizard funcionando
- backend de onboarding con CORS correcto
- deploy a produccion exitoso
- confirmacion de creacion en BD
- almacenamiento de semilla para `landing_plantilla`
- flujo previsto con botones finales:
  - `Editar`
  - `Ir a crear mi web de reservas`

### Pendiente o a confirmar

- verificar visualmente que los 2 botones finales queden activos y visibles en la version final pegada en Elementor
- implementar en `landing_plantilla` la lectura de `ba_landing_seed` si aun no existe
- definir en la pagina de branding como se guardaran:
  - logo
  - colores
  - imagenes
  - tema
  - textos
- revisar aparte el chat de `n8n`
- revisar aparte `session/me`

## Resumen ejecutivo

Se construyo y corrigio un flujo completo para crear barberias desde Elementor contra el endpoint real de onboarding. El principal bloqueo serio fue CORS en produccion. Ese problema se soluciono modificando el `route.ts`, haciendo commit, push y deploy en Easypanel. El endpoint ya responde correctamente a `OPTIONS` y `POST` con los headers esperados, y el usuario ya pudo completar con exito la creacion en BD.

En frontend, el wizard quedo alineado al backend real, el admin ya no se fuerza desde la sesion, se mejoro la validacion de barberos, se adapto al tema global, se preparo la transicion a `landing_plantilla` y se definio que la pagina siguiente sera la encargada del branding completo de la landing del cliente.

## Infraestructura, credenciales y conexiones detectadas

### Advertencia

Esta seccion contiene informacion sensible detectada en archivos locales, scripts, respaldos y capturas de configuracion. No todos los valores son credenciales de acceso a panel; varios son:

- URLs de servicios
- secretos de backend
- API keys
- tokens de deploy
- nombres de servicios
- variables de entorno
- endpoints internos o publicos

No se deben compartir fuera del proyecto.

### 1. WordPress y dominio publico

Valores detectados:

- Sitio principal WordPress:
  - `https://barberagency-barberagency.gymh5g.easypanel.host/`
- Registro:
  - `https://barberagency-barberagency.gymh5g.easypanel.host/registro/`
- Registro barberias:
  - `https://barberagency-barberagency.gymh5g.easypanel.host/registro-barberias/`
- Perfil:
  - `https://barberagency-barberagency.gymh5g.easypanel.host/perfil/`
- Planes:
  - `https://barberagency-barberagency.gymh5g.easypanel.host/planes/`
- Landing builder:
  - `https://barberagency-barberagency.gymh5g.easypanel.host/landing_plantilla/`

Observacion:

- En archivos locales no se encontro usuario o password del panel de WordPress.
- Lo encontrado hasta ahora son URLs funcionales del sitio y paginas relacionadas.

### 2. Endpoint de onboarding actual

- Endpoint backend:
  - `https://barberagency-app.gymh5g.easypanel.host/api/onboarding/complete`

### 3. n8n: URLs, API y variables detectadas

Valores confirmados en archivos locales:

- UI de n8n:
  - `https://barberagency-n8n.gymh5g.easypanel.host/home/workflows`
- Base URL de n8n:
  - `https://barberagency-n8n.gymh5g.easypanel.host`
- Webhook base:
  - `https://barberagency-n8n.gymh5g.easypanel.host`
- Header de API de n8n:
  - `X-N8N-API-KEY`
- API key de n8n:
  - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZWRlNzUwOC05OTdhLTQ0NzUtYjJiOC05YmUyZTNhNmE0MTUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTFjNDhiZTYtZTlhMy00MGZiLWFjNzgtODNhZGYxMDlmZDVkIiwiaWF0IjoxNzcxODg1Mzg4fQ.1cw2fTj02GOgWZ95N7ibhbAGhw2Cnn9aqgDnxEddQ7c`

Variables detectadas para n8n:

- `WEBHOOK_URL=https://barberagency-n8n.gymh5g.easypanel.host`
- `PGRST_JWT_SECRET=mi_super_secret_jwt_barberia_2026`
- `JWT_EXPIRES_IN=7d`
- `GOOGLE_CLIENT_ID=674090944474-uvnagnjnf92e0u7jc6jpd9uhhtl52a0v.apps.googleusercontent.com`
- `ADMIN_ACTIVATION_SECRET=w4y/z5wIu52KtGGSP/PpIVo3M+2sbgpFAJg+x5l2V/eZ8MFY39KfI0IjHKMXmN+l`

Endpoints de sesion detectados en el frontend:

- `https://barberagency-n8n.gymh5g.easypanel.host/webhook/barberagency/session/me`
- `https://barberagency-n8n.gymh5g.easypanel.host/webhook/barberagency/session/logout`

Observacion:

- En archivos locales no se encontro usuario/password de login visual al panel de n8n.
- Si la instancia usa login propio en UI, esas credenciales no quedaron documentadas en los archivos revisados.

### 4. Credencial Postgres usada por n8n

Se detecto esta referencia de credencial dentro de n8n:

- Nombre visible:
  - `Postgres account`
- ID interno de n8n:
  - `SOV6oSyuHI9cxgLF`
- Host interno detectado:
  - `barberagency_barberagencycol`

Observacion:

- No se encontro en los archivos revisados el usuario/password completo de la conexion Postgres.
- Si esos valores existen, probablemente estan guardados dentro de la credencial interna de n8n y no en texto plano en este repo.

### 5. Easypanel / servicios detectados

Servicios y dominios observados:

- App backend:
  - `https://barberagency-app.gymh5g.easypanel.host`
- Sitio WordPress / landing:
  - `https://barberagency-barberagency.gymh5g.easypanel.host`
- n8n:
  - `https://barberagency-n8n.gymh5g.easypanel.host`

Servicio de app observado en Easypanel:

- Proyecto / servicio:
  - `barberagency / app`

Variables de entorno observadas en Easypanel para `barberagency / app`:

- `NODE_ENV=production`
- `PORT=3000`
- `NEXT_PUBLIC_API_URL=https://api.agencia2c.cloud`
- `PGRST_JWT_SECRET=mi_super_secret_jwt_barberia_2026`
- `NIXPACKS_NODE_VERSION=22`
- `APP_PUBLIC_URL=https://app.agencia2c.cloud`
- `LANDING_BASE_DOMAIN=book.agencia2c.cloud`
- `LANDING_BASE_PROTOCOL=https`
- `ONBOARDING_CORS_ORIGINS=https://barberagency-barberagency.gymh5g.easypanel.host`

Valores de fallback detectados en el codigo del backend:

- API publica fallback:
  - `https://api.agencia2c.cloud`
- App public URL fallback:
  - `https://barberagency-app.gymh5g.easypanel.host`

Observacion:

- No se encontro usuario/password del panel de Easypanel en archivos locales.
- Lo encontrado fueron:
  - servicios
  - dominios
  - variables
  - webhook de deploy

### 6. Webhook de deploy detectado

Se uso este webhook para disparar deploy del servicio:

- `http://72.60.25.191:3000/api/deploy/c3ea712cbed41bb46c9e47669e3d1ae2eee43fab2ad0abb6`

Observacion:

- Este valor es sensible porque permite activar despliegues del servicio.

### 7. Hostinger

Estado real de la informacion encontrada:

- No se encontraron en archivos locales credenciales directas de acceso a Hostinger.
- Tampoco se encontraron usuario/password del panel de Hostinger.
- Lo que si quedo identificado es la infraestructura publicada que termina sirviendose a traves de dominios gestionados en Easypanel.

### 8. Que SI esta documentado vs que NO se encontro

#### Documentado y confirmado

- dominios publicos
- rutas principales de WordPress
- endpoint de onboarding
- URLs de n8n
- API key de n8n
- secretos de backend relevantes
- variables de entorno observadas en Easypanel
- nombre del servicio en Easypanel
- webhook de deploy
- referencia de credencial Postgres en n8n

#### No encontrado en los archivos revisados

- usuario/password de WordPress admin
- usuario/password del panel de n8n
- usuario/password del panel de Easypanel
- usuario/password del panel de Hostinger
- usuario/password completos de la credencial Postgres dentro de n8n

### 9. Recomendacion de manejo

Por seguridad, esta seccion deberia tratarse como documento sensible del proyecto. Si se comparte fuera del entorno tecnico, conviene redactar o eliminar:

- `N8N_API_KEY`
- `PGRST_JWT_SECRET`
- `ADMIN_ACTIVATION_SECRET`
- webhook de deploy
- cualquier secreto adicional que aparezca despues
