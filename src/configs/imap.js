import Imap from 'imap';
import config from '../../config.json';

export const imap = new Imap({
    user: config.imap.user,
    password: config.imap.password,
    host: config.imap.host,
    port: config.imap.port,
    tls: config.imap.tls,
    // debug: function(msg){console.log('imap:', msg);}
});
