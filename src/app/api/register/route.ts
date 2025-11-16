import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/users';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, password, and name are required' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        const user = await createUser(email, password, name);

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'User created successfully', user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error: any) {
        if (error?.message === 'User already exists') {
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

