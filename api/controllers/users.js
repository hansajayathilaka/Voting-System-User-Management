const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const User = require('../models/users');


exports.validate = (req, res, next) => {
    return res.status(200).json({
        message: "Auth Success.",
        error: null,
    });
}

exports.get_hash = (req, res, next) => {
    const userData = req.userData;
    User.find({_id: userData._id})
        .exec()
        .then(doc => {
            if (doc.length > 0) {
                let salt;
                if (doc[0].salt == null) {
                    salt = crypto.randomBytes(16).toString();
                    User.findByIdAndUpdate(userData._id, {salt}, (err, result) => {
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

                // Implementing argon2 with all its parameters
                argon2.hash(userData._id, salt + process.env.SALT)
                    .then(derivedKey => {
                        res.status(200).json({
                            hash: derivedKey,
                            message: "",
                            error: null,
                        });
                    }).catch(err => {
                        if (err) {
                            res.status(500).json({
                                message: "",
                                error: err,
                            });
                        }
                    });
            } else {
                res.status(500).json({
                    message: "",
                    error: "No user found."
                });
            }
        })
}

exports.get_user = (req, res, next) => {
    User.findById(req.params._id)
        .exec()
        .then((doc) => {
            const user = {
                _id: doc._id,
                email: doc.email,
                first_name: doc.first_name,
                last_name: doc.last_name,
                address: doc.address,
                id_number: doc.id_number,
                phone: doc.phone,
                gender: doc.gender,
            };
            return res.status(200).json({
                user: user,
                message: '',
                error: null,
            });
        })
        .catch((err) => {
            res.status(404).json({
                user: null,
                message: '',
                error: err,
            });
        });
}

exports.signup_user = (req, res, next) => {
    User.find({id_number: req.body.id_number})
        .exec()
        .then(doc => {
            if (doc.length !== 0) {
                res.status(409).json({
                    message: "Please check the id_number and email.",
                    error: "User exists.",
                });
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (!err) {
                        const user = new User({
                            _id: new mongoose.Types.ObjectId(),
                            email: req.body.email,
                            password: hash,
                            first_name: req.body.first_name,
                            last_name: req.body.last_name,
                            address: req.body.address,
                            id_number: req.body.id_number,
                            phone: req.body.phone,
                            gender: req.body.gender,
                            pro_pic: req.files[0].filename,
                        });
                        user.save()
                            .then(doc => {
                                console.log(doc);
                                delete doc.password;
                                const data = {
                                    _id: doc._id,
                                    email: doc.email,
                                    first_name: doc.first_name,
                                    last_name: doc.last_name,
                                    address: doc.address,
                                    id_number: doc.id_number,
                                    phone: doc.phone,
                                    gender: doc.gender,
                                    pro_pic: process.env.AUTHORITY + "/media/" + doc.pro_pic,
                                };
                                res.status(201).json({
                                    user: data,
                                    message: '',
                                    error: null,
                                });
                            })
                            .catch(err => {
                                console.log(err);
                                res.status(500).json({
                                    message: "",
                                    error: err
                                });
                            });
                    } else {
                        console.log(err);
                        res.status(500).json({
                            message: "",
                            error: err
                        });
                    }
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: "",
                error: err
            });
        });
};

exports.update_user = (req, res, next) => {
    const _id = req.body.id;
    const user = new User({
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        address: req.body.address,
        phone: req.body.phone,
        gender: req.body.gender,
    });
    User.findByIdAndUpdate(_id, user,(err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "",
                error: err,
            });
        }
        return res.status(200).json({
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
                message: "",
                error: err
            });
        });
};

exports.login_user = (req, res, next) => {
    User.find({email: req.body.email})
        .exec()
        .then(doc => {
            if (doc.length === 0) {
                res.status(401).json({
                    message: '',
                    error: "Auth Failed."
                });
            }
            // Compare Password
            bcrypt.compare(req.body.password, doc[0].password, (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({
                        message: "",
                        error: err
                    });
                }
                // Check auth
                if (result) {
                    // Generate JWT
                    const token = jwt.sign(
                        {
                            email: doc[0].email,
                            _id: doc[0]._id
                        },
                        process.env.JWT_KEY,
                        {
                            expiresIn: "2h"
                        }
                    );
                    res.status(200).json({
                        message: "Auth Successful.",
                        user: {
                            id: doc[0]._id,
                            email: doc[0].email,
                            first_name: doc[0].first_name,
                            last_name: doc[0].last_name,
                            address: doc[0].address,
                            phone: doc[0].phone,
                            gender: doc[0].gender,
                            pro_pic: process.env.AUTHORITY + "/media/" + doc[0].pro_pic,
                        },
                        token: token,
                        error: null,
                    });
                } else {
                    res.status(401).json({
                        message: '',
                        error: "Auth Failed."
                    });
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: "",
                error: err,
            });
        });
};
