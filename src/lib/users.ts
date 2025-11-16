import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

export interface User {
    id: string;
    email: string;
    password: string; // hashed password
    name: string;
    createdAt: string;
}

// Ensure data directory exists
function ensureDataDirectory() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Read users from file
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

// Write users to file
function writeUsers(users: User[]): void {
    ensureDataDirectory();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
    const users = readUsers();
    return users.find(user => user.email === email) || null;
}

// Get user by id
export async function getUserById(id: string): Promise<User | null> {
    const users = readUsers();
    return users.find(user => user.id === id) || null;
}

// Create new user
export async function createUser(email: string, password: string, name: string): Promise<User> {
    const users = readUsers();
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
        throw new Error('User already exists');
    }
    
    // Hash password
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

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

