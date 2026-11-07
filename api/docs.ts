import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureMethod } from "../src/lib/http";

const SWAGGER_UI_VERSION = "5.34.1";

function buildDocsHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Shopping Services API — Swagger UI</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css"
    />
    <style>
      html { box-sizing: border-box; overflow-y: scroll; }
      *, *::before, *::after { box-sizing: inherit; }
      body { margin: 0; background: #f8fafc; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/api/openapi",
          dom_id: "#swagger-ui",
          deepLinking: true,
          displayRequestDuration: true,
          defaultModelsExpandDepth: 1,
          persistAuthorization: true,
          tryItOutEnabled: true
        });
      };
    </script>
  </body>
</html>`;
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["GET"])) {
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).end(buildDocsHtml());
}
