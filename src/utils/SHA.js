import crypto from 'crypto';
import fs from 'fs';

export function getSHA(file) {
    try {
        if (fs.existsSync(file)) {
            const buff = fs.readFileSync(file);
            return crypto.createHash('sha256').update(buff).digest('hex');
        }
    } catch (err) {
        console.error(err);
    }
}
