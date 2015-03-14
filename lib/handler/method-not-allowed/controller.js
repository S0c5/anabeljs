/**
 * Created by s0c45 on 11/03/15.
 */


module.exports = function(req, res, next){
    res.status(405);
    res.json({message: "Method Not Allowed"});
};
