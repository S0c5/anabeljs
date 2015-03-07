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
        enum: ['d','a']
    },
    name: {
        type: String,
        default: 'Anonymous',
        validator: /\w+/
    },
    password: {
        required: true,
        type: String,
        validator: /^.{10,100}$/
    }
});


module.exports = mongoose.model('user', userSchema);


