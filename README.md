# Next Auth App

Aplicación de autenticación con Next.js que permite a los usuarios registrarse, iniciar sesión y acceder a páginas protegidas.

## Características

- Registro de usuarios con email y contraseña
- Inicio de sesión con credenciales
- Autenticación con Google OAuth
- Autenticación con GitHub OAuth
- Protección de rutas con middleware
- Rate limiting para prevenir ataques de fuerza bruta
- Encriptación de contraseñas con bcrypt
- Gestión de sesiones con NextAuth

## Tecnologías

- Next.js 16
- NextAuth.js
- TypeScript
- Tailwind CSS
- bcrypt

## Requisitos Previos

- Node.js 18 o superior
- npm o yarn

## Instalación

1. Clona el repositorio o navega al directorio del proyecto

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secret_key_aqui

# Para autenticación con Google (opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Para autenticación con GitHub (opcional)
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret
```

Para generar NEXTAUTH_SECRET, puedes usar:
```bash
openssl rand -base64 32
```

## Configuración de OAuth

### Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Crea credenciales OAuth 2.0
5. Agrega `http://localhost:3000/api/auth/callback/google` como URL de redirección autorizada
6. Copia el Client ID y Client Secret a tu archivo `.env.local`

### GitHub OAuth

1. Ve a GitHub Settings > Developer settings > OAuth Apps
2. Crea una nueva OAuth App
3. Agrega `http://localhost:3000/api/auth/callback/github` como Authorization callback URL
4. Copia el Client ID y Client Secret a tu archivo `.env.local`

## Ejecutar la Aplicación

Para desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

Para producción:
```bash
npm run build
npm start
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # Configuración de NextAuth
│   │   └── register/             # Endpoint de registro
│   ├── components/               # Componentes reutilizables
│   ├── dashboard/                # Página del dashboard (protegida)
│   ├── profile/                  # Página de perfil (protegida)
│   ├── register/                 # Página de registro
│   └── signIn/                   # Página de inicio de sesión
├── lib/
│   ├── users.ts                  # Funciones de gestión de usuarios
│   └── rateLimit.ts              # Sistema de rate limiting
├── middleware.ts                 # Middleware de protección de rutas
└── types/
    └── next-auth.d.ts            # Tipos de TypeScript para NextAuth
```

## Rutas

- `/` - Redirige al dashboard
- `/signIn` - Página de inicio de sesión
- `/register` - Página de registro
- `/dashboard` - Dashboard del usuario (requiere autenticación)
- `/profile` - Perfil del usuario (requiere autenticación)

## Características de Seguridad

- Las contraseñas se encriptan usando bcrypt antes de almacenarse
- Rate limiting: máximo 3 intentos fallidos, luego bloqueo de 15 minutos
- Las rutas protegidas requieren autenticación
- Los usuarios autenticados no pueden acceder a las páginas de signIn o register
- Las contraseñas nunca se exponen en las respuestas de la API

## Datos

Los datos de usuarios se almacenan en `data/users.json` y el rate limiting en `data/rateLimit.json`. Estos archivos se crean automáticamente cuando se ejecuta la aplicación por primera vez.
