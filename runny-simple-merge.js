const sf = require('./pipeline.js');

var p = sf.Pipeline("runny-simple-merge").withComponent(
	sf.Zip("bitcoin-calculation")
	.withProcess(function(p1, p2) {
		var r = {
			'amount': (p1.amount * p2.body.result.price.last)
		}
		return {"request" : JSON.stringify(r)};
	})
	.withSource(
		sf.Source("btc-raw", sf.DataSourceType.GLOBAL).withThrottling(1,1)
	)
	.withSource(
		sf.Source("ico-parity", sf.DataSourceType.GLOBAL, function(s) {
			return s.ico == 'btc' &&
				s.currency == 'usd' ;
		}).withThrottling(1,1)
	)
).withComponent(
	sf.Zip("ethereum-calculation")
	.withProcess(function(p1, p2) {
		var r = {
			'amount': (p1.gas * p2.body.result.price.last) / 1000000
		}
		return {"request" : JSON.stringify(r)};
	})
	.withSource(
		sf.Source("eth-pending", sf.DataSourceType.GLOBAL).withThrottling(1,1)
	)
	.withSource(
		sf.Source("ico-parity", sf.DataSourceType.GLOBAL, function(s) {
			return s.ico == 'eth' &&
				s.currency == 'usd';
		}).withThrottling(1,1)
	)
).withComponent(
	sf.Merge("merge",2)
	.withSource("ethereum-calculation")
	.withSource("bitcoin-calculation")
	.toSink(sf.APISink("api-compare","http://localhost:4499/api/trxs",
    {   "http.method":"POST",
        "http.api-key":"8d77f7d14a4864931f15072255fc1b58de8941cd45a8a896ed4ebf99b93d2e33"}))
)

//console.log(JSON.stringify(p));
p.compile();