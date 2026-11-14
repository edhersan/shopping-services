export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Shopping Services API",
    version: "1.0.0",
    description: [
      "Microservicios serverless para catálogo, carrito, órdenes y pago simulado.",
      "",
      "Reglas de negocio: impuesto del 8%, envío de $5.99 (gratis desde $100) y máximo de 99 unidades por línea.",
      "El pago es simulado: las tarjetas terminadas en 0000 se rechazan con HTTP 402.",
      "Los usuarios, las órdenes y el stock viven en memoria y se reinician en cada cold start.",
    ].join("\n"),
    contact: {
      name: "Shopping App",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    { url: "/api", description: "Servidor actual (mismo origen)" },
    {
      url: "https://<tu-proyecto>.vercel.app/api",
      description: "Producción en Vercel (reemplaza el subdominio)",
    },
  ],
  tags: [
    { name: "Sistema", description: "Salud y documentación" },
    { name: "Autenticación", description: "Registro, inicio de sesión y usuario actual" },
    { name: "Catálogo", description: "Productos disponibles" },
    { name: "Carrito", description: "Validación de precios y stock" },
    { name: "Órdenes", description: "Checkout y pago simulado" },
  ],
  security: [],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Autenticación"],
        operationId: "login",
        summary: "Inicia sesión y devuelve un JWT",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthCredentials" },
              example: { email: "ana@example.com", password: "password123" },
            },
          },
        },
        responses: {
          "200": {
            description: "Sesión iniciada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Autenticación"],
        operationId: "register",
        summary: "Registra un usuario y devuelve un JWT",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterUserRequest" },
              example: {
                name: "Ana Torres",
                email: "ana@example.com",
                password: "password123",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario registrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { $ref: "#/components/responses/Conflict" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Autenticación"],
        operationId: "getCurrentUser",
        summary: "Obtiene el usuario autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Usuario autenticado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PublicUserResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/health": {
      get: {
        tags: ["Sistema"],
        operationId: "getHealth",
        summary: "Estado del servicio",
        responses: {
          "200": {
            description: "Servicio activo",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/products": {
      get: {
        tags: ["Catálogo"],
        operationId: "listProducts",
        summary: "Lista el catálogo de productos",
        parameters: [
          {
            name: "search",
            in: "query",
            required: false,
            description: "Texto a buscar en nombre y descripción.",
            schema: { type: "string" },
            example: "aurora",
          },
          {
            name: "category",
            in: "query",
            required: false,
            description: "Filtra por categoría. Usa `all` o vacío para todas.",
            schema: {
              type: "string",
              enum: ["all", "electronics", "clothing", "home", "sports"],
            },
            example: "electronics",
          },
        ],
        responses: {
          "200": {
            description: "Listado de productos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductListResponse" },
              },
            },
          },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Catálogo"],
        operationId: "getProductById",
        summary: "Obtiene un producto por su identificador",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Identificador del producto (por ejemplo, p-001).",
            schema: { type: "string" },
            example: "p-001",
          },
        ],
        responses: {
          "200": {
            description: "Producto encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductResponse" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/cart/validate": {
      post: {
        tags: ["Carrito"],
        operationId: "validateCart",
        summary: "Valida stock y calcula los totales del carrito",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CartItemsRequest" },
              example: {
                items: [
                  { productId: "p-001", quantity: 2 },
                  { productId: "p-005", quantity: 1 },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Totales calculados por el servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PricingSummaryResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/orders": {
      post: {
        tags: ["Órdenes"],
        operationId: "createOrder",
        summary: "Crea una orden y simula el pago",
        description:
          "Recalcula los precios en el servidor, valida el stock y, si el pago es aprobado, descuenta las unidades. Las tarjetas terminadas en 0000 reciben HTTP 402.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderRequest" },
              example: {
                items: [{ productId: "p-005", quantity: 1 }],
                customer: {
                  fullName: "Ana Torres",
                  email: "ana@example.com",
                  address: "Calle 123 # 45-67",
                  city: "Bogotá",
                  zipCode: "110111",
                },
                payment: {
                  cardNumber: "4111111111111111",
                  holderName: "Ana Torres",
                  expiry: "12/30",
                  cvv: "123",
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Orden creada y pago aprobado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrderResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "402": { $ref: "#/components/responses/PaymentDeclined" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Órdenes"],
        operationId: "getOrderById",
        summary: "Consulta una orden por su identificador",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Identificador de la orden (por ejemplo, ord_abc123).",
            schema: { type: "string" },
            example: "ord_9860d85368b8",
          },
        ],
        responses: {
          "200": {
            description: "Orden encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrderResponse" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/docs": {
      get: {
        tags: ["Sistema"],
        operationId: "getSwaggerUi",
        summary: "Documentación interactiva (Swagger UI)",
        responses: {
          "200": {
            description: "Página HTML con Swagger UI",
            content: {
              "text/html": {
                schema: { type: "string" },
              },
            },
          },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/openapi": {
      get: {
        tags: ["Sistema"],
        operationId: "getOpenApiDocument",
        summary: "Especificación OpenAPI 3.0 en JSON",
        responses: {
          "200": {
            description: "Documento OpenAPI",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Product: {
        type: "object",
        required: [
          "id",
          "name",
          "description",
          "price",
          "currency",
          "category",
          "imageUrl",
          "stock",
          "rating",
        ],
        properties: {
          id: { type: "string", example: "p-001" },
          name: { type: "string", example: "Aurora Wireless Headphones" },
          description: {
            type: "string",
            example: "Audífonos inalámbricos con cancelación activa de ruido.",
          },
          price: { type: "number", format: "double", example: 89.99 },
          currency: { type: "string", enum: ["USD"], example: "USD" },
          category: {
            type: "string",
            enum: ["electronics", "clothing", "home", "sports"],
            example: "electronics",
          },
          imageUrl: {
            type: "string",
            format: "uri",
            example: "https://placehold.co/600x450/1e293b/f8fafc?text=Aurora+Headphones",
          },
          stock: { type: "integer", minimum: 0, example: 24 },
          rating: { type: "number", format: "double", minimum: 0, maximum: 5, example: 4.7 },
        },
      },
      OrderLineInput: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "string", example: "p-001" },
          quantity: { type: "integer", minimum: 1, maximum: 99, example: 2 },
        },
      },
      CartItemsRequest: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/OrderLineInput" },
          },
        },
      },
      PricedCartItem: {
        type: "object",
        required: ["productId", "name", "imageUrl", "unitPrice", "quantity", "lineTotal"],
        properties: {
          productId: { type: "string", example: "p-001" },
          name: { type: "string", example: "Aurora Wireless Headphones" },
          imageUrl: { type: "string", format: "uri" },
          unitPrice: { type: "number", format: "double", example: 89.99 },
          quantity: { type: "integer", example: 2 },
          lineTotal: { type: "number", format: "double", example: 179.98 },
        },
      },
      PricingSummary: {
        type: "object",
        required: ["items", "subtotal", "tax", "shipping", "total", "currency"],
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/PricedCartItem" },
          },
          subtotal: { type: "number", format: "double", example: 179.98 },
          tax: { type: "number", format: "double", example: 14.4 },
          shipping: { type: "number", format: "double", example: 0 },
          total: { type: "number", format: "double", example: 194.38 },
          currency: { type: "string", enum: ["USD"], example: "USD" },
        },
      },
      Customer: {
        type: "object",
        required: ["fullName", "email", "address", "city", "zipCode"],
        properties: {
          fullName: { type: "string", minLength: 3, example: "Ana Torres" },
          email: { type: "string", format: "email", example: "ana@example.com" },
          address: { type: "string", minLength: 5, example: "Calle 123 # 45-67" },
          city: { type: "string", minLength: 2, example: "Bogotá" },
          zipCode: {
            type: "string",
            pattern: "^[0-9A-Za-z -]{3,10}$",
            example: "110111",
          },
        },
      },
      PaymentRequest: {
        type: "object",
        required: ["cardNumber", "holderName", "expiry", "cvv"],
        properties: {
          cardNumber: {
            type: "string",
            pattern: "^\\d{13,19}$",
            example: "4111111111111111",
            description: "Solo dígitos. Las tarjetas terminadas en 0000 se rechazan.",
          },
          holderName: { type: "string", minLength: 3, example: "Ana Torres" },
          expiry: {
            type: "string",
            pattern: "^(0[1-9]|1[0-2])/[0-9]{2}$",
            example: "12/30",
          },
          cvv: { type: "string", pattern: "^\\d{3,4}$", example: "123" },
        },
      },
      CreateOrderRequest: {
        type: "object",
        required: ["items", "customer", "payment"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/OrderLineInput" },
          },
          customer: { $ref: "#/components/schemas/Customer" },
          payment: { $ref: "#/components/schemas/PaymentRequest" },
        },
      },
      PaymentSummary: {
        type: "object",
        required: ["brand", "last4", "approved"],
        properties: {
          brand: { type: "string", example: "Visa" },
          last4: { type: "string", example: "1111" },
          approved: { type: "boolean", example: true },
        },
      },
      Order: {
        type: "object",
        required: [
          "id",
          "customer",
          "items",
          "subtotal",
          "tax",
          "shipping",
          "total",
          "currency",
          "status",
          "payment",
          "createdAt",
        ],
        properties: {
          id: { type: "string", example: "ord_9860d85368b8" },
          customer: { $ref: "#/components/schemas/Customer" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/PricedCartItem" },
          },
          subtotal: { type: "number", format: "double", example: 54.99 },
          tax: { type: "number", format: "double", example: 4.4 },
          shipping: { type: "number", format: "double", example: 5.99 },
          total: { type: "number", format: "double", example: 65.38 },
          currency: { type: "string", enum: ["USD"], example: "USD" },
          status: { type: "string", enum: ["paid", "declined"], example: "paid" },
          payment: { $ref: "#/components/schemas/PaymentSummary" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-11-07T15:30:00.000Z",
          },
        },
      },
      HealthPayload: {
        type: "object",
        required: ["status", "service", "timestamp"],
        properties: {
          status: { type: "string", enum: ["ok"], example: "ok" },
          service: { type: "string", example: "shopping-services" },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-11-07T15:30:00.000Z",
          },
          PublicUser: {
            type: "object",
            required: ["id", "name", "email", "createdAt"],
            properties: {
              id: { type: "string", example: "usr_9860d85368b8" },
              name: { type: "string", example: "Ana Torres" },
              email: { type: "string", format: "email", example: "ana@example.com" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          AuthCredentials: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email", example: "ana@example.com" },
              password: { type: "string", minLength: 8, example: "password123" },
            },
          },
          RegisterUserRequest: {
            allOf: [
              { $ref: "#/components/schemas/AuthCredentials" },
              {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", minLength: 3, example: "Ana Torres" },
                },
              },
            ],
          },
          AuthResponse: {
            type: "object",
            required: ["success", "data"],
            properties: {
              success: { type: "boolean", enum: [true], example: true },
              data: {
                type: "object",
                required: ["token", "user"],
                properties: {
                  token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
                  user: { $ref: "#/components/schemas/PublicUser" },
                },
              },
            },
          },
          PublicUserResponse: {
            type: "object",
            required: ["success", "data"],
            properties: {
              success: { type: "boolean", enum: [true], example: true },
              data: { $ref: "#/components/schemas/PublicUser" },
            },
          },
        },
      },
      ApiError: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: {
            type: "string",
            example: "Revisa los datos enviados.",
          },
          details: {
            type: "array",
            items: { type: "string" },
            example: ["El correo electrónico no es válido."],
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", enum: [false], example: false },
          error: { $ref: "#/components/schemas/ApiError" },
        },
      },
      HealthResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/HealthPayload" },
        },
      },
      ProductResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/Product" },
        },
      },
      ProductListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Product" },
          },
        },
      },
      PricingSummaryResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/PricingSummary" },
        },
      },
      OrderResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/Order" },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Autenticación requerida o token inválido",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      InternalError: {
        description: "Error de configuración o del servidor",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      BadRequest: {
        description: "Datos de entrada inválidos",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Revisa los datos enviados.",
                details: ["El correo electrónico no es válido."],
              },
            },
          },
        },
      },
      NotFound: {
        description: "Recurso no encontrado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "PRODUCT_NOT_FOUND",
                message: "El producto p-999 no existe.",
              },
            },
          },
        },
      },
      Conflict: {
        description: "Stock insuficiente o conflicto de inventario",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "INSUFFICIENT_STOCK",
                message: "Stock insuficiente para Aurora Wireless Headphones.",
                details: ["Disponible: 3, solicitado: 5."],
              },
            },
          },
        },
      },
      PaymentDeclined: {
        description: "Pago simulado rechazado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "PAYMENT_DECLINED",
                message: "El pago simulado fue rechazado.",
                details: [
                  "La tarjeta terminada en 0000 fue rechazada porque termina en 0000.",
                ],
              },
            },
          },
        },
      },
      MethodNotAllowed: {
        description: "Método HTTP no permitido",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "METHOD_NOT_ALLOWED",
                message: "Método PUT no permitido. Usa: GET.",
              },
            },
          },
        },
      },
    },
  },
} as const;
