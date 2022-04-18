const mongoose = require('mongoose');
const crypto = require('crypto');

const User = require('../models/users');
const { encrypt, decrypt } = require('../utils/crypto');


exports.get_hash = (req, res, next) => {
    const userData = req.userData;
    User.find({id: userData.id})
        .exec()
        .then(doc => {
            if (doc.length > 0) {
                let salt;
                if (doc[0].salt == null) {
                    salt = crypto.randomBytes(16).toString();
                    User.findByIdAndUpdate(doc[0]._id, {salt}, (err, result) => {
                        if (err) {
                            console.log("Salt is not saved.");
                            console.log(err);
                        } else {
                            console.log(result);
                        }
                    });
                } else {
                    salt = doc[0].salt;
                }

                // Implementing pbkdf2 with all its parameters
                crypto.pbkdf2(String(doc[0]._id), salt + process.env.SALT, 10000, 64, 'sha512', (err, derivedKey) => {
                    if (err) {
                        return res.status(500).json({
                            status: false,
                            hash: null,
                            message: "",
                            error: err,
                        });
                    }

                    return res.status(200).json({
                        status: true,
                        hash: "0x" + derivedKey.toString('hex'),
                        message: "",
                        error: null,
                    });
                });

            } else {
                return res.status(500).json({
                    status: false,
                    hash: null,
                    message: "",
                    error: "No user found."
                });
            }
        });
}

exports.get_user = (req, res, next) => {
    User.findById(req.params._id)
        .exec()
        .then((doc) => {
            const user = {
                _id: doc._id,
                id: doc.id,
                email: decrypt(doc.email),
                fullname: decrypt(doc.fullname),
            };
            return res.status(200).json({
                status: true,
                user: user,
                message: '',
                error: null,
            });
        })
        .catch((err) => {
            res.status(404).json({
                status: false,
                user: null,
                message: '',
                error: err,
            });
        });
}

exports.signup_user = (req, res, next) => {
    User.find({id: req.body.id})
        .exec()
        .then(user => {
            if (user.length >= 1) {
                return res.status(409).json({
                    status: false,
                    message: '',
                    error: 'User already exists.'
                });
            } else {
                let user;
                try {
                    user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        id: req.body.id,
                        email: encrypt(req.body.email),
                        fullname: encrypt(req.body.fullname),
                    });
                } catch (err) {
                    return res.status(400).json({
                        status: false,
                        message: "Error while creating user.",
                        error: err,
                    });
                }
                user.save()
                    .then(doc => {
                        User.findById(doc._id)
                            .exec()
                            .then(_user => {
                                const data = {
                                    _id: _user._id,
                                    id: _user.id,
                                    email: decrypt(_user.email),
                                    fullname: decrypt(_user.fullname),
                                };
                                res.status(201).json({
                                    status: true,
                                    user: data,
                                    message: '',
                                    error: null,
                                });
                            })
                            .catch(err => {
                                return res.status(500).json({
                                    status: false,
                                    message: "Error while creating user.",
                                    error: err,
                                });
                            });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            status: false,
                            user: null,
                            message: "",
                            error: err
                        });
                    });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                status: false,
                user: null,
                message: "",
                error: err
            });
        });

};

exports.update_user = (req, res, next) => {
    const _id = req.body._id;
    const user = new User({
        email: encrypt(req.body.email),
        fullname: encrypt(req.body.fullname),
    });
    User.findByIdAndUpdate(_id, user,(err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                status: false,
                message: "",
                error: err,
            });
        }
        return res.status(200).json({
            status: true,
            message: "Updated.",
            error: null,
        });
    })
}

exports.delete_user = (req, res, next) => {
    User.remove({_id: req.params._id})
        .exec()
        .then(doc => {
            console.log(doc);
            res.status(200).json({
                status: false,
                message: "User Deleted.",
                user: {
                    _id: req.params._id
                },
                error: null,
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                status: false,
                message: "",
                error: err
            });
        });
};
