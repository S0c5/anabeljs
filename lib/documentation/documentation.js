/**
 * Created by s0c5 on 5/03/15.
 */

    

var Documentation = function(){
    var self = this;
    
    this.regexToPath = function(regex, keys) {
        
        var arrayPaths = regex.toString().split('\\/');
        var subPath = "";
        var i = 0;
        var j = 0;
        var completePath = "/";
        
        while (i < arrayPaths.length) {
            subPath = arrayPaths[i];
            if (i === 0 || i >= arrayPaths.length - 2) {
                i++;
                continue;
            }
            if (subPath[0] === '(') {
                completePath += ':' + keys[j].name + "/";
                i++;
                j++;
            } else {
                completePath += subPath + "/";
            }
            i++;
        }
        completePath[completePath.length] = '';
        return completePath;
    };
    
    
    this.document = function(router){
        var documentation = [];

        if(router._documentation !== undefined)
        {   


            documentation = documentation.concat(router._documentation);

        }
        
        if(router.name === 'router' && router.stack === undefined )
        {

            var rootPath    = self.regexToPath(router.regexp, router.keys);
            var docs        = self.document(router.handle);
            

            for(var i in docs){
                var tmp = docs[i];
                tmp.path = (rootPath + tmp.path).replace('//','/');
            }
            
            return docs;
        }
        if(router.stack){
            for(var index in router.stack)
            {
                var stack = router.stack[index];
                documentation = documentation.concat(self.document(stack));
            }
        }
        return documentation;
    };

   this.generate = function(router){
       
       if (router.stack === undefined) {
           router = router._router
       }
       var cmp = function(a,b){
            if(a.name > b.name)
                return 1;
            if(a.name < b.name)
                return -1;
            return 0;
       };
       
       var endPoint = {};
       
       var docs = self.document(router).sort(cmp);
       
       var current = null;
       var last = null;
       
       for(var i in docs){
           var doc  = docs[i];
           
           current = doc.name;
           
           if(endPoint[current] === undefined){
               endPoint[current] = [];
           }
           endPoint[current].push(doc);
       }
       console.log(endPoint);
       return endPoint;
   };

};


module.exports = new Documentation();