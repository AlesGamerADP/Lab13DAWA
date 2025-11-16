import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    createdAt: string;
}

function ensureDataDirectory() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
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
        ensureDataDirectory();
        console.log('[Users] Intentando escribir en:', USERS_FILE);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        console.log('[Users] Archivo escrito exitosamente');
    } catch (error: any) {
        console.error('[Users] Error escribiendo archivo:', error);
        console.error('[Users] Error message:', error?.message);
        console.error('[Users] Error code:', error?.code);
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

