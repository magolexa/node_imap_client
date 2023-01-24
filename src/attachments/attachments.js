import {toUpper} from '../utils/utils';

export function findAttachmentParts(struct, attachments = []) {
    struct.forEach((element) => {
        if (Array.isArray(element)) findAttachmentParts(element, attachments);
        else if (
            element.disposition &&
            ['INLINE', 'ATTACHMENT'].indexOf(
                toUpper(element.disposition.type)
            ) > -1
        ) {
            attachments.push(element);
        }
    });
    return attachments;
}
