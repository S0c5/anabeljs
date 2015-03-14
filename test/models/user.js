/**
 * Created by s0c45 on 5/03/15.
 */

var anabel      = require('../../');
var mongoose    = require('mongoose');


var userSchema = new mongoose.Schema({
    cedula: { 
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['a','i']
    },
    name: {
        type: String,
        default: 'Anonymous',
        validate: /^[a-z]+$/
    },
    password: {
        required: true,
        type: String,
        validate: /^[0-9]{1,4}$/
    }
});


module.exports = mongoose.model('user', userSchema);


