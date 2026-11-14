# Shopping Services

Microservicios serverless en Node.js/TypeScript para una app de compras: autenticación, catálogo, validación de carrito, órdenes y pago simulado. Diseñados para desplegarse directamente como **Vercel Functions** desde la carpeta `api/`.

Este repositorio es independiente: no depende del monorepo de la app móvil y puede publicarse en GitHub y desplegarse en Vercel por sí solo.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- (Opcional) CLI de Vercel para desplegar.

## Instalación y desarrollo

```bash
npm install
npm run dev
```

Servidor local en `http://localhost:3000`. Usa el mismo código de `api/` mediante un adaptador local, sin necesidad de iniciar sesión en Vercel.

Alternativa con el runtime de Vercel (requiere `npx vercel login`):

```bash
npm run dev:vercel
```

Prueba rápida:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/products
```

## Endpoints

Todas las respuestas usan el sobre:

```ts
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: string[] } };
```

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio |
| POST | `/api/auth/register` | Registra un usuario y devuelve un JWT |
| POST | `/api/auth/login` | Inicia sesión y devuelve un JWT |
| GET | `/api/auth/me` | Devuelve el usuario del JWT enviado |
| GET | `/api/docs` | Swagger UI interactivo |
| GET | `/api/openapi` | Especificación OpenAPI 3.0 (JSON) |
| GET | `/api/products?search=&category=` | Catálogo filtrado |
| GET | `/api/products/:id` | Detalle de producto |
| POST | `/api/cart/validate` | Valida stock y calcula totales |
| POST | `/api/orders` | Crea la orden y simula el pago |
| GET | `/api/orders/:id` | Consulta una orden |

Errores: `400` validación, `402` pago rechazado, `404` no encontrado, `405` método no permitido, `409` stock insuficiente.

Las rutas privadas reciben el token mediante `Authorization: Bearer <token>`. El registro y el inicio de sesión responden con `{ token, user }` dentro del sobre estándar de la API. Los usuarios se almacenan en memoria, igual que las órdenes y el stock, por lo que se reinician en cada cold start o redeploy.

### Documentación interactiva (Swagger)

Con el servidor iniciado:

- Página de inicio: `http://localhost:3000/`
- Swagger UI: `http://localhost:3000/api/docs`
- Especificación OpenAPI 3.0: `http://localhost:3000/api/openapi`

En Vercel:

- Inicio: `https://<tu-proyecto>.vercel.app/`
- Swagger: `https://<tu-proyecto>.vercel.app/api/docs`

Desde Swagger UI puedes probar todos los endpoints (incluido el pago simulado) con el botón **Try it out**. La interfaz carga Swagger UI desde el CDN de unpkg, por lo que necesita conexión a internet.

### Validar carrito

```bash
curl -X POST http://localhost:3000/api/cart/validate \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"p-001","quantity":2}]}'
```

### Crear orden

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "p-005", "quantity": 1}],
    "customer": {
      "fullName": "Ana Torres",
      "email": "ana@example.com",
      "address": "Calle 123 # 45-67",
      "city": "Bogotá",
      "zipCode": "110111"
    },
    "payment": {
      "cardNumber": "4111111111111111",
      "holderName": "Ana Torres",
      "expiry": "12/30",
      "cvv": "123"
    }
  }'
```

## Reglas de negocio

- Impuesto: **8%** sobre el subtotal.
- Envío: **$5.99**; gratis desde **$100**.
- Stock máximo por línea: **99** unidades.
- El servidor recalcula precios y totales (fuente de verdad) y descuenta stock al aprobar el pago.
- Pago simulado: las tarjetas terminadas en `0000` se rechazan con `402`; el resto se aprueba.
- Nunca se almacena el número completo de la tarjeta; solo marca y `last4`.
- Catálogo y órdenes viven en memoria: se reinician en cada cold start o redeploy.

## Estructura

```text
shopping-services/
├─ api/                  # Vercel Functions (una entrada por ruta)
│  ├─ auth/              # Registro, login y usuario actual
│  ├─ health.ts
│  ├─ docs.ts            # Swagger UI
│  ├─ openapi.ts         # Especificación OpenAPI
│  ├─ products/index.ts
│  ├─ products/[id].ts
│  ├─ cart/validate.ts
│  ├─ orders/index.ts
│  └─ orders/[id].ts
├─ public/
│  └─ index.html         # Landing del deployment (raíz /)
├─ src/
│  ├─ data/products.ts   # Catálogo seed
│  ├─ dev/server.ts      # Servidor local de desarrollo
│  ├─ docs/openapi.ts    # Documento OpenAPI 3.0
│  ├─ lib/               # HTTP, errores y validación
│  ├─ services/          # Lógica de negocio
│  ├─ store/orders.ts    # Órdenes en memoria
│  └─ types/
├─ vercel.json
├─ tsconfig.json
├─ .env.example
└─ package.json
```

## Variables de entorno

Copia `.env.example` a `.env` si necesitas cambiar el origen permitido:

```bash
ALLOWED_ORIGIN=*
JWT_SECRET=replace-with-a-long-random-secret
```

- `ALLOWED_ORIGIN`: origen permitido por CORS. Usa `*` para la demo o el dominio de tu app.
- `JWT_SECRET`: clave privada de al menos 32 caracteres para firmar los tokens JWT.

## Desplegar en Vercel

1. Sube este repositorio a GitHub.
2. En Vercel, importa el repositorio.
3. Framework Preset: **Other**. No requiere build command ni output directory.
4. Añade la variable `ALLOWED_ORIGIN` si quieres restringir CORS.
5. Despliega. La API quedará en `https://<tu-proyecto>.vercel.app/api`.

No hay dependencias de runtime: las funciones solo usan módulos nativos de Node, por lo que Vercel compila `api/**/*.ts` directamente.

## Conectar la app móvil

En el proyecto móvil define la URL base del API:

```bash
EXPO_PUBLIC_API_URL=https://<tu-proyecto>.vercel.app/api
```

Sin esa variable, la app móvil usa `http://10.0.2.2:3000/api` en emulador Android y `http://localhost:3000/api` en iOS/web.

## Publicar en GitHub

El repositorio ya está inicializado con la rama `main`. Para publicarlo:

```bash
git add .
git commit -m "Initial commit: shopping services"
git remote add origin https://github.com/<tu-usuario>/shopping-services.git
git push -u origin main
```

## Verificación

```bash
npm run typecheck
```

TypeScript en modo `strict` y sin uso de `any`.
