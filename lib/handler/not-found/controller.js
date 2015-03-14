/**
 * Created by s0c45 on 11/03/15.
 */

module.exports = function(err, req, res, next){
    res.status(404);
    res.json({message: "Endpoint Not found"});
};