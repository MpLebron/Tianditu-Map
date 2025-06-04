const mongoose = require('mongoose');

const sharedMapSchema = new mongoose.Schema({
    uniqueId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    mapCode: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SharedMap', sharedMapSchema); 