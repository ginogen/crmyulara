# CRM Yulara

Sistema CRM para gestión de clientes y envío de correos.

## Envío de Correos Electrónicos

El sistema proporciona dos métodos para enviar correos electrónicos:

### 1. Método Directo (desde Next.js)

Este método envía correos directamente desde el servidor Next.js utilizando la API de Gmail. Es más rápido y más fiable, ya que evita problemas de CORS y manejo de credenciales.

### 2. Método Proxy (usando Edge Functions)

Este método envía correos a través de una función Edge de Supabase. Aunque es más flexible para escenarios donde se necesita procesamiento adicional, puede presentar problemas de CORS y manejo de sesiones.

## Páginas de Prueba

Se han incluido varias páginas para probar estas funcionalidades:

1. **/test-direct**: Prueba el envío de correos mediante el método directo.
2. **/test-email-methods**: Compara ambos métodos (directo y proxy) en una sola página.
3. **/test-edge**: Prueba específica para la Edge Function.

## Requisitos para usar Gmail

Para utilizar la funcionalidad de envío de correos electrónicos, es necesario:

1. Conectar tu cuenta de Gmail desde el panel de control.
2. Tener configuradas las siguientes variables de entorno:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_SITE_URL`

## Solución de Problemas

Si encuentras errores al enviar correos, verifica lo siguiente:

1. **Problemas de sesión**: Asegúrate de estar conectado y tener una sesión activa. Puedes usar el botón "Actualizar sesión" en las páginas de prueba.
2. **Credenciales de Gmail**: Verifica que tus credenciales de Gmail estén correctamente configuradas y no hayan expirado.
3. **CORS**: Si hay errores de CORS en el método proxy, utiliza preferentemente el método directo.
4. **Logs del servidor**: Revisa los logs del servidor para obtener más información sobre los errores.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
