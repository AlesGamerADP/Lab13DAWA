import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/users';

export async function POST(request: NextRequest) {
    try {
        console.log('[Register] Iniciando registro de usuario');
        const body = await request.json();
        const { email, password, name } = body;

        console.log('[Register] Datos recibidos:', { email, name, passwordLength: password?.length });

        if (!email || !password || !name) {
            console.log('[Register] Validación fallida: campos requeridos faltantes');
            return NextResponse.json(
                { error: 'Email, password, and name are required' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('[Register] Validación fallida: formato de email inválido');
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            console.log('[Register] Validación fallida: contraseña muy corta');
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        console.log('[Register] Validaciones pasadas, creando usuario...');
        const user = await createUser(email, password, name);
        console.log('[Register] Usuario creado exitosamente:', user.email);

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'User created successfully', user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('[Register] Error completo:', error);
        console.error('[Register] Error message:', error?.message);
        console.error('[Register] Error stack:', error?.stack);
        
        if (error.message === 'User already exists') {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 409 }
            );
        }

        const errorMessage = error?.message || 'Unknown error';
        const errorDetails = process.env.NODE_ENV === 'development' 
            ? errorMessage 
            : 'Internal server error';

        return NextResponse.json(
            { error: errorDetails },
            { status: 500 }
        );
    }
}

