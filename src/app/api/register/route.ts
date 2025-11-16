import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/users';

export async function POST(request: NextRequest) {
    try {
        console.log('[Register] ========== INICIANDO REGISTRO ==========');
        console.log('[Register] Timestamp:', new Date().toISOString());
        console.log('[Register] URL:', request.url);
        console.log('[Register] Method:', request.method);
        
        console.log('[Register] Leyendo body de la request...');
        const body = await request.json();
        console.log('[Register] Body recibido:', JSON.stringify({ email: body.email, name: body.name, passwordLength: body.password?.length }));
        
        const { email, password, name } = body;
        console.log('[Register] Datos extraídos:', { email, name, passwordLength: password?.length });

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

        console.log('[Register] Todas las validaciones pasadas');
        console.log('[Register] Llamando a createUser...');
        
        let user;
        try {
            user = await createUser(email, password, name);
            console.log('[Register] Usuario creado exitosamente:', user.email);
        } catch (createError: any) {
            console.error('[Register] Error en createUser:', createError);
            console.error('[Register] Error type:', typeof createError);
            console.error('[Register] Error name:', createError?.name);
            console.error('[Register] Error message:', createError?.message);
            console.error('[Register] Error stack:', createError?.stack);
            console.error('[Register] Error code:', createError?.code);
            throw createError;
        }

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'User created successfully', user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('[Register] ========== ERROR EN REGISTRO ==========');
        console.error('[Register] Timestamp:', new Date().toISOString());
        console.error('[Register] Error completo:', error);
        console.error('[Register] Error tipo:', typeof error);
        console.error('[Register] Error nombre:', error?.name);
        console.error('[Register] Error mensaje:', error?.message);
        console.error('[Register] Error código:', error?.code);
        console.error('[Register] Error syscall:', error?.syscall);
        console.error('[Register] Error errno:', error?.errno);
        console.error('[Register] Error path:', error?.path);
        console.error('[Register] Error stack:', error?.stack);
        console.error('[Register] NODE_ENV:', process.env.NODE_ENV);
        console.error('[Register] process.cwd():', process.cwd());
        
        if (error?.message === 'User already exists') {
            console.log('[Register] Usuario ya existe, retornando 409');
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 409 }
            );
        }

        const errorMessage = error?.message || 'Unknown error';
        const errorDetails = process.env.NODE_ENV === 'development' 
            ? errorMessage 
            : 'Internal server error';
        
        console.error('[Register] Retornando error al cliente:', errorDetails);

        return NextResponse.json(
            { error: errorDetails },
            { status: 500 }
        );
    }
}

