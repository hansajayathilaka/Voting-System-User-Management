const crypto = require('crypto');


const algorithm = process.env.ENCODING_ALGORITHM;
let key = process.env.SECRET_KEY;   // Should be contain only 24 characters
const aes_salt = process.env.AES_SALT;
key = crypto.scryptSync(key, aes_salt, key.length);


module.exports.encrypt = function(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, new Buffer(key), iv);
    const encrypted = cipher.update(text);
    const finalBuffer = Buffer.concat([encrypted, cipher.final()]);
    const encryptedHex = iv.toString('hex') + ':' + finalBuffer.toString('hex');
    return encryptedHex;
}

module.exports.decrypt = function(text) {
    const encryptedArray = text.split(':');
    const iv = new Buffer(encryptedArray[0], 'hex');
    const encrypted = new Buffer(encryptedArray[1], 'hex');
    const decipher = crypto.createDecipheriv(algorithm, new Buffer(key), iv);
    const decrypted = decipher.update(encrypted);
    const clearText = Buffer.concat([decrypted, decipher.final()]).toString();
    return clearText;
}
