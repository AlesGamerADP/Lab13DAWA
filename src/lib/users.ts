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
    const dataDir = getDataDir();
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
    } catch {
        return [];
    }
}

function writeUsers(users: User[]): void {
    try {
        ensureDataDirectory();
        const jsonData = JSON.stringify(users, null, 2);
        fs.writeFileSync(USERS_FILE, jsonData);
    } catch (error: any) {
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
    const users = readUsers();
    
    if (users.find(user => user.email === email)) {
        throw new Error('User already exists');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser: User = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        email,
        password: hashedPassword,
        name,
        createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    writeUsers(users);
    
    return newUser;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

