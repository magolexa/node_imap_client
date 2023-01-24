import Imap from 'imap';
import {ENV} from './env';

export const imap = new Imap({
    user: ENV.user,
    password: ENV.password,
    host: ENV.host,
    port: 993,
    tls: true,
    // debug: function(msg){console.log('imap:', msg);}
});
