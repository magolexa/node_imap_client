import {getSHA} from './utils/SHA';
import fs from 'fs';
import {Base64Decode} from 'base64-stream';
import Imap from 'imap';
import {toUpper} from './utils/utils';
import {imap} from './configs';
import {findAttachmentParts} from './attachments/attachments';
import {getMessageList, decodeStream} from './mails/message'

// В режиме реального времени мониторит письма в почте, сохраняет вложения на латинице
// Если есть непрочитанные письма в моменте запуска тоже их проверяет
export function liveConnect() {
    // directory
    const dir = './downloads';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    // imap
    imap.once('error', console.error);
    imap.on('ready', () => {
        imap.openBox('INBOX', false, (error, box) => {
            if (error) throw error;
            // console.log(box.flags);
            console.log('Connected!');
            imap.on('mail', () => {
                imap.search(['UNSEEN'], (error, results) => {
                    if (error) throw error;

                    const messageList = getMessageList(results, '', true, true)

                    messageList.on('message', (msg, seqno) => {
                        console.log('New message #%d', seqno);
                        const prefix = `(#${seqno})`;
                        let header = null;

                        msg.on('body', (stream) => {
                            let buffer = '';
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                                console.log(buffer)
                            });
                            stream.once('end', () => {
                                header = Imap.parseHeader(buffer);
                                console.log(buffer)
                            });
                            console.log(buffer)
                            
                        });

                        msg.once('attributes', (attrs) => {
                            const attachments = findAttachmentParts(
                                attrs.struct
                            );
                            console.log(
                                `${prefix} uid=${attrs.uid} Has attachments: ${attachments.length}`
                            );
                            console.log(
                                `${prefix} uid=${attrs.uid} Flagged as "Seen"`
                            );
                            imap.addFlags(attrs.uid, '\\Seen');
                            attachments.forEach((attachment) => {
                                console.log(
                                    `${prefix} Fetching attachment ${attachment.params.name}`
                                );
                                // console.log(attachment.disposition.params["filename*"])
                                const filename = attachment.params.name; // need decode disposition.params['filename*']

                                const encoding = toUpper(attachment.encoding);
                                // A6 UID FETCH {attrs.uid} (UID FLAGS INTERNALDATE BODY.PEEK[{attachment.partID}])
                                const messageList = imap.fetch(attrs.uid, {
                                    bodies: [attachment.partID],
                                });

                                messageList.on('message', (msg, seqno) => {
                                    const prefix = `(#${seqno})`;
                                    msg.on('body', (stream, info) => {
                                        const writeStream =
                                            fs.createWriteStream(
                                                `${dir}/${filename}`
                                            );
                                        writeStream.on('finish', () => {
                                            console.log(
                                                `${prefix} Done writing to file ${filename}`
                                            );
                                            console.log(
                                                `${prefix} SHA256 of ${filename} is: ${getSHA(
                                                    dir + '/' + filename
                                                )}`
                                            );
                                        });
                                        decodeStream(writeStream, encoding, stream)
                                    });

                                    msg.once('end', () => {
                                        console.log(
                                            `${prefix} Finished attachment file to ${dir}/${filename}`
                                        );
                                    });
                                });
                                // messageList.once('end', () => { console.log('WS: downloder finish') })
                            });
                        });
                        msg.once('end', () => {
                            console.log(`${prefix} Finished email`);
                        });
                    });
                });
            });
        });
    });

    imap.connect();
}
