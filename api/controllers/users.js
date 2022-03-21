const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/users');


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

                // Implementing pbkdf2 with all its parameters
                crypto.pbkdf2(userData._id, salt + process.env.SALT, 10000, 64, 'sha512', (err, derivedKey) => {
                    if (err) {
                        res.status(500).json({
                            status: false,
                            hash: null,
                            message: "",
                            error: err,
                        });
                        return;
                    }

                    res.status(200).json({
                        status: true,
                        hash: "0x" + derivedKey.toString('hex'),
                        message: "",
                        error: null,
                    });
                });

            } else {
                res.status(500).json({
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
                email: doc.email,
                first_name: doc.first_name,
                last_name: doc.last_name,
                address: doc.address,
                id_number: doc.id_number,
                phone: doc.phone,
                gender: doc.gender,
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
    User.find({email: req.body.email})
        .exec()
        .then(doc => {
            if (doc.length !== 0) {
                res.status(409).json({
                    status: false,
                    message: "Please check the email.",
                    error: "User exists.",
                });
            } else {
                let user;
                try {
                    user = new User({
                        _id: new mongoose.Types.ObjectId(req.body._id),
                        email: req.body.email,
                        fullname: req.body.fullname,
                    });
                } catch (err) {
                    return res.status(400).json({
                        status: false,
                        message: "Invalid _id.",
                        error: err,
                    });
                }
                user.save()
                    .then(doc => {
                        const data = {
                            _id: doc._id,
                            email: doc.email,
                            fullname: doc.fullname,
                        };
                        res.status(201).json({
                            status: true,
                            user: data,
                            message: '',
                            error: null,
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            status: false,
                            user: null,
                            message: "Example ID : " + new mongoose.Types.ObjectId(),
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
        email: req.body.email,
        fullname: req.body.fullname,
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
