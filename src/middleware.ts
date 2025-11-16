import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;

        // Si el usuario está autenticado y trata de acceder a signIn o register, redirigir al dashboard
        if (token && (pathname === '/signIn' || pathname === '/register')) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const pathname = req.nextUrl.pathname;
                
                // Rutas que requieren autenticación
                const protectedRoutes = ['/dashboard', '/profile'];
                const isProtectedRoute = protectedRoutes.some(route => 
                    pathname.startsWith(route)
                );

                // Si es una ruta protegida, requiere token
                if (isProtectedRoute) {
                    return !!token;
                }

                // Para signIn y register, siempre permitir acceso
                // (la redirección de usuarios autenticados se maneja en la función middleware)
                if (pathname === '/signIn' || pathname === '/register') {
                    return true;
                }

                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/profile/:path*',
        '/signIn',
        '/signIn/:path*',
        '/register',
        '/register/:path*'
    ]
};
