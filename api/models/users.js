const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true,
        unique: true,
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    password: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: false,
    },
    last_name: {
        type: String,
        required: false,
    },
    address: {
        type: String,
        required: false,
    },
    id_number: {
        type: String,
        unique: true,
        required: false,
    },
    phone: {
        type: String,
    },
    gender: {
        type: String,
    },
    salt: {
        type: String,
        required: false,
        default: null,
    },
    pro_pic: {
        type: String,
    }
});

module.exports = mongoose.model('User', userSchema);
