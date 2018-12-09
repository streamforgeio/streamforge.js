const sf = require('./pipeline.js');


//var z = sf.Source("aa11",null,null).withConflation(function(){console.log("asdsad")});


var p = sf.Pipeline().withComponent(sf.Zip("z1").withProcess(function(){}).withSource(sf.Source("falan")))
console.log(JSON.stringify(p));
p.save("/tmp/sf.json")
