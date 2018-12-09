const sf = require('./pipeline.js');

var p = sf.Pipeline().withComponent(
                            sf.Zip("add")
                                .withProcess(function(p1,p2){
                                                            return { 'value': (p1.value + p2.value )} 
                                                        })
                                .withSource(
                                    sf.Source("s1",sf.DataSourceType.GLOBAL)
                                )
                                .withSource(
                                    sf.Source("s2",sf.DataSourceType.GLOBAL)
                                )
                            )
            .withComponent(sf.Zip("add2",true)
                                .withProcess(function(p1,p2){
                                    return {'value': (p1.value + p2.value)}
                                }).withSource(
                                    sf.Source("s3",sf.DataSourceType.GLOBAL))
                                  .withSource(
                                      sf.Source("add",sf.DataSourceType.LOCAL)))
                            
console.log(JSON.stringify(p));
p.save("/tmp/sf.json")
