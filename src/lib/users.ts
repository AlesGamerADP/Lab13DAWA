import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const getDataDir = () => {
    const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    return isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
};

const USERS_FILE = path.join(getDataDir(), 'users.json');

export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    createdAt: string;
}

function ensureDataDirectory() {
    try {
        const dataDir = getDataDir();
        console.log('[Users] ensureDataDirectory - Directorio:', dataDir);
        console.log('[Users] process.cwd():', process.cwd());
        console.log('[Users] VERCEL:', process.env.VERCEL);
        console.log('[Users] Directorio existe?', fs.existsSync(dataDir));
        
        if (!fs.existsSync(dataDir)) {
            console.log('[Users] Creando directorio data...');
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('[Users] Directorio creado exitosamente');
        } else {
            console.log('[Users] Directorio ya existe');
        }
        
        const stats = fs.statSync(dataDir);
        console.log('[Users] Stats del directorio:', {
            isDirectory: stats.isDirectory(),
            mode: stats.mode
        });
    } catch (error: any) {
        console.error('[Users] Error en ensureDataDirectory:', error);
        console.error('[Users] Error message:', error?.message);
        console.error('[Users] Error code:', error?.code);
        throw error;
    }
}

function readUsers(): User[] {
    ensureDataDirectory();
    if (!fs.existsSync(USERS_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users file:', error);
        return [];
    }
}

function writeUsers(users: User[]): void {
    try {
        console.log('[Users] writeUsers - Iniciando escritura');
        console.log('[Users] Número de usuarios a escribir:', users.length);
        ensureDataDirectory();
        
        console.log('[Users] Ruta del archivo:', USERS_FILE);
        console.log('[Users] Archivo existe?', fs.existsSync(USERS_FILE));
        
        const jsonData = JSON.stringify(users, null, 2);
        console.log('[Users] Tamaño del JSON:', jsonData.length, 'caracteres');
        
        console.log('[Users] Escribiendo archivo...');
        fs.writeFileSync(USERS_FILE, jsonData);
        console.log('[Users] Archivo escrito exitosamente');
        
        const stats = fs.statSync(USERS_FILE);
        console.log('[Users] Archivo creado - Tamaño:', stats.size, 'bytes');
    } catch (error: any) {
        console.error('[Users] Error escribiendo archivo');
        console.error('[Users] Error completo:', error);
        console.error('[Users] Error type:', typeof error);
        console.error('[Users] Error name:', error?.name);
        console.error('[Users] Error message:', error?.message);
        console.error('[Users] Error code:', error?.code);
        console.error('[Users] Error errno:', error?.errno);
        console.error('[Users] Error syscall:', error?.syscall);
        console.error('[Users] Error path:', error?.path);
        throw new Error(`Error writing users file: ${error?.message || 'Unknown error'}`);
    }
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const users = readUsers();
    return users.find(user => user.email === email) || null;
}

export async function getUserById(id: string): Promise<User | null> {
    const users = readUsers();
    return users.find(user => user.id === id) || null;
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
    try {
        console.log('[Users] createUser - Iniciando creación para:', email);
        const users = readUsers();
        console.log('[Users] Usuarios existentes:', users.length);
        
        if (users.find(user => user.email === email)) {
            console.log('[Users] Usuario ya existe:', email);
            throw new Error('User already exists');
        }
        
        console.log('[Users] Encriptando contraseña...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('[Users] Contraseña encriptada');
        
        const newUser: User = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            email,
            password: hashedPassword,
            name,
            createdAt: new Date().toISOString(),
        };
        
        users.push(newUser);
        console.log('[Users] Guardando usuario...');
        writeUsers(users);
        console.log('[Users] Usuario guardado exitosamente');
        
        return newUser;
    } catch (error: any) {
        console.error('[Users] Error en createUser:', error);
        throw error;
    }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

