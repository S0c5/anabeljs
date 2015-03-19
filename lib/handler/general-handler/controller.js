/**
 * Created by s0c45 on 11/03/15.
 */




module.exports = function(err, req, res, next){
    res.status(500);
    res.json({message: "An error has occurred, our minions are working for solve it"});
};