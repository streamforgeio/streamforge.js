const sf = require('./pipeline.js');


var p = sf.Pipeline().withComponent(sf.Zip("z1").withSource(sf.Source("falan")))
p.save("/tmp/falan2.json")
