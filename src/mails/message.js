import {imap} from '../configs/imap';
import {Base64Decode} from 'base64-stream';
import {getSHA} from '../utils/SHA';

export function getMessageList(results, bodies, struct, markSeen) {
    return imap.fetch(results, {
        bodies: bodies,
        struct: struct,
        markSeen: markSeen
    });
};

export function decodeStream(writeStream, encoding, stream) {
    if (encoding === 'BASE64')
    stream
        .pipe(new Base64Decode())
        .pipe(writeStream);
    else stream.pipe(writeStream);
}