import fs from 'fs';
import path from 'path';

const getDataDir = () => {
    const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    return isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
};

const RATE_LIMIT_FILE = path.join(getDataDir(), 'rateLimit.json');

interface RateLimitEntry {
    email: string;
    attempts: number;
    lastAttempt: string;
    blockedUntil?: string;
}

function ensureDataDirectory() {
    const dataDir = getDataDir();
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function readRateLimitData(): Record<string, RateLimitEntry> {
    ensureDataDirectory();
    if (!fs.existsSync(RATE_LIMIT_FILE)) {
        return {};
    }
    try {
        const data = fs.readFileSync(RATE_LIMIT_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

function writeRateLimitData(data: Record<string, RateLimitEntry>): void {
    ensureDataDirectory();
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(data, null, 2));
}

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

export function checkRateLimit(email: string): { allowed: boolean; remainingAttempts?: number; blockedUntil?: Date } {
    const data = readRateLimitData();
    const entry = data[email];
    
    if (!entry) {
        return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }
    
    if (entry.blockedUntil) {
        const blockedUntil = new Date(entry.blockedUntil);
        if (blockedUntil > new Date()) {
            return { allowed: false, blockedUntil };
        }
        delete data[email];
        writeRateLimitData(data);
        return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }
    
    if (entry.attempts >= MAX_ATTEMPTS) {
        const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);
        entry.blockedUntil = blockedUntil.toISOString();
        writeRateLimitData(data);
        return { allowed: false, blockedUntil };
    }
    
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.attempts };
}

export function recordFailedAttempt(email: string): void {
    const data = readRateLimitData();
    const entry = data[email] || { email, attempts: 0, lastAttempt: new Date().toISOString() };
    
    entry.attempts += 1;
    entry.lastAttempt = new Date().toISOString();
    
    if (entry.attempts >= MAX_ATTEMPTS) {
        entry.blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS).toISOString();
    }
    
    data[email] = entry;
    writeRateLimitData(data);
}

export function resetRateLimit(email: string): void {
    const data = readRateLimitData();
    delete data[email];
    writeRateLimitData(data);
}

