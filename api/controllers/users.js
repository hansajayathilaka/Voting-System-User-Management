const mongoose = require('mongoose');

const User = require('../models/users');
const { generateHash } = require("../utils/hash");
const { encrypt, decrypt } = require('../utils/crypto');


exports.get_hash = (req, res, next) => {
    const userData = req.userData;
    User.find({id: userData.id})
        .exec()
        .then(doc => {
            if (doc.length > 0) {
                let hrstart = process.hrtime();
                return generateHash(doc[0]).then((response) => {
                    let hrend = process.hrtime(hrstart);
                    return res.status(200).json({...response, time: (hrend[0] + (hrend[1] / 1000000)).toFixed(4) + "ms"});
                }).catch(err => {
                    return res.status(500).json(err);
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
            let hrstart = process.hrtime();
            const user = {
                _id: doc._id,
                id: doc.id,
                email: decrypt(doc.email),
                fullname: decrypt(doc.fullname),
            };
            let hrend = process.hrtime(hrstart);
            return res.status(200).json({
                status: true,
                user: user,
                message: '',
                error: null,
                time: (hrend[0] + (hrend[1] / 1000000)).toFixed(4)/2 + "ms",
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
                let user, hrstart, hrend;
                try {
                    hrstart = process.hrtime();
                    user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        id: req.body.id,
                        email: encrypt(req.body.email),
                        fullname: encrypt(req.body.fullname),
                    });
                    hrend = process.hrtime(hrstart);
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
                                    time: (hrend[0] + (hrend[1] / 1000000)).toFixed(4)/2 + "ms",
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
    const _id = req.params._id;
    let hrstart = process.hrtime();
    const user = new User({
        email: encrypt(req.body.email),
        fullname: encrypt(req.body.fullname),
    });
    let hrend = process.hrtime(hrstart);
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
            time: (hrend[0] + (hrend[1] / 1000000)).toFixed(4)/2 + "ms",
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
