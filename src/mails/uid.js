import {imap} from '../configs';

export function removeEmailByUid(my_uid) {
    imap.once('error', console.error);
    imap.once('ready', () => {
        imap.openBox('INBOX', false, (error) => {
            if (error) throw error;
            console.log('Connected!');
            imap.search(['ALL'], (error, results) => {
                if (error) throw error;

                for (const uid of results) {
                    const mails = imap.fetch(uid, {
                        bodies: '',
                    });
                    imap.addFlags(my_uid, '\\Deleted');
                    mails.once('end', () => imap.end());
                }
            });
        });
    });

    imap.connect();
}
