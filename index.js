const config = require('./config.json');
const SHA = require('./SHA')
const fs = require('fs');
const Imap    = require('imap');
const {Base64Decode} = require('base64-stream')
const info = require('console');
const getSHA = require('./SHA');

var imap    = new Imap({
    "user": config.imap.user,
      "password": config.imap.password,
      "host": config.imap.host,
      "port": config.imap.port,
      "tls": config.imap.tls
  // ,debug: function(msg){console.log('imap:', msg);}
});

function openInbox(cb) {imap.openBox('INBOX', true, cb)}

function openInboxW(cb) {imap.openBox('INBOX', false, cb)}

function toUpper(thing) { return thing && thing.toUpperCase ? thing.toUpperCase() : thing }

function findAttachmentParts(struct, attachments) {
  attachments = attachments ||  []
  struct.forEach((i) => {
    if (Array.isArray(i)) findAttachmentParts(i, attachments)
    else if (i.disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(i.disposition.type)) > -1) {
      attachments.push(i)
    }
  })
  return attachments
}

function toUpper(thing) { return thing && thing.toUpperCase ? thing.toUpperCase() : thing }

function findAttachmentParts(struct, attachments) {
  attachments = attachments ||  []
  struct.forEach((i) => {
    if (Array.isArray(i)) findAttachmentParts(i, attachments)
    else if (i.disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(i.disposition.type)) > -1) {
      attachments.push(i)
    }
  })
  return attachments
}

// Удалить письмо передав туда UID
function removeUID(my_uid) {
  imap.once("error", console.error);
  imap.once("ready", () => {
    imap.openBox("INBOX", false, (error, box) => {
      if (error) throw error;
      console.log('Connected!')
      imap.search(["ALL"], (error, results) => {
          if (error) throw error;

          for (const uid of results) {
            const mails = imap.fetch(uid, {
              bodies: ""
            });
            imap.addFlags(my_uid, "\\Deleted")
            mails.once("end", () => imap.end());
          }

        }
      );
    });
  });

  imap.connect();
}

// removeUID("23")


// В режиме реального времени мониторит письма в почте, сохраняет вложения на латинице
// Если есть непрочитанные письма в моменте запуска тоже их проверяет
function liveConnect() {

  // directory
  const dir = config.downloads.directory
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // imap
  imap.once("error", console.error);
  imap.on("ready", () => {
    imap.openBox("INBOX", false, (error, box) => {
      console.log(box.flags)
      if (error) throw error;

      console.log('Connected!')
      imap.on("mail",  () => {
        imap.search(["UNSEEN"], (error, results) => {
          if (error) throw error;

          var f = imap.fetch(results, { 
            bodies: '',
            struct: true,
            markSeen: true
          });

          f.on('message', (msg, seqno) => {
            console.log('New message #%d', seqno)
            const prefix = `(#${seqno})`
            var header = null
            msg.on('body', (stream, info) => {
              var buffer = ''
              stream.on('data', (chunk) => { buffer += chunk.toString('utf8') });
              stream.once('end', () => { header = Imap.parseHeader(buffer) })
            });
            msg.once('attributes', (attrs) => {
              
              const attachments = findAttachmentParts(attrs.struct);
              console.log(`${prefix} uid=${attrs.uid} Has attachments: ${attachments.length}`);
              console.log(`${prefix} uid=${attrs.uid} Flagged as "Seen"`);
              imap.addFlags(attrs.uid, "\\Seen")
              attachments.forEach((attachment) => {
              
                console.log(`${prefix} Fetching attachment ${attachment.params.name}`)
                // console.log(attachment.disposition.params["filename*"])
                const filename = attachment.params.name  // need decode disposition.params['filename*'] 
      
                const encoding = toUpper(attachment.encoding)
                // A6 UID FETCH {attrs.uid} (UID FLAGS INTERNALDATE BODY.PEEK[{attachment.partID}])
                const f = imap.fetch(attrs.uid, { bodies: [attachment.partID] })
                f.on('message', (msg, seqno) => {
                  const prefix = `(#${seqno})`
                  msg.on('body', (stream, info) => {
                    const writeStream = fs.createWriteStream(`${dir}/${filename}`);
                    writeStream.on('finish', () => {
                      console.log(`${prefix} Done writing to file ${filename}`)
                      console.log(`${prefix} SHA256 of ${filename} is: ${getSHA(dir + '/' + filename)}`)
                    })
                    if (encoding === 'BASE64') stream.pipe(new Base64Decode()).pipe(writeStream)
                    else stream.pipe(writeStream)
                  })
                  msg.once('end', () => { console.log(`${prefix} Finished attachment file to ${dir}/${filename}`) })
                })
                // f.once('end', () => { console.log('WS: downloder finish') })
              })
            })
            msg.once('end', () => { console.log(`${prefix} Finished email`); })
          });

        }
      );
     
      })
    });
  });

  imap.connect();
}

liveConnect()