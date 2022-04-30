const {randomBytes, pbkdf2} = require('crypto');
const {promisify} = require('util');
const User = require("../models/users");
const pbkdf2Async = promisify(pbkdf2);

exports.generateHash = async (user, len = 64) => {
    let salt;
    if (user.salt == null) {
        salt = randomBytes(16).toString("hex");
        User.findByIdAndUpdate(user._id, {salt}, (err, result) => {
            if (err) {
                console.log("Salt is not saved.");
                console.log(err);
            } else {
                console.log(result);
            }
        });
    } else {
        salt = user.salt;
    }

    // Implementing pbkdf2 with all its parameters
    try {
        const hash = await pbkdf2Async((user._id).toString(), salt + process.env.SALT, 10000, len, 'sha512');
        return {
            status: true,
            hash: "0x" + hash.toString('hex'),
            message: "",
            error: null,
        };
    } catch (err) {
        return {
            status: false,
            hash: null,
            message: "",
            error: err,
        };
    }
}
