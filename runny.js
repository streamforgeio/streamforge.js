const sf = require('./pipeline.js');

var p = sf.Pipeline().withComponent(
	sf.Zip("bitcoin-calculation")
	.withProcess(function(p1, p2) {
		if (p1.vout.length == 0)
			return {
				'amount': 0
			}
		var r = {
			'amount': (p1.vout[0].amount * p2.body.result.price.last) / 1000000
		}
		return r;
	})
	.withSource(
		sf.Source("btc-raw", sf.DataSourceType.GLOBAL)
	)
	.withSource(
		sf.Source("ico-parity", sf.DataSourceType.GLOBAL, function(s) {
			return s.ico == 'btc' &&
				s.currency == 'usd' &&
				s.market == 'bitfinex';
		})
	)
).withComponent(
	sf.Zip("ethereum-calculation")
	.withProcess(function(p1, p2) {
		var r = {
			'amount': (p1.gas * p2.body.result.price.last) / 1000000
		}
		return r;
	})
	.withSource(
		sf.Source("eth-pending", sf.DataSourceType.GLOBAL).withConflation(function(s1, s2) {
			return {
				'gas': (s1.gas + s2.gas)
			}
		})
	)
	.withSource(
		sf.Source("ico-parity", sf.DataSourceType.GLOBAL, function(s) {
			return s.ico == 'eth' &&
				s.currency == 'usd' &&
				s.market == 'bitfinex';
		})
	)
).withComponent(
    sf.Zip("compare", sf.APISink("http://api-sink.streamforge.io/api/total-transactions",
    {   "method":"POST",
        "api-key":"8d77f7d14a4864931f15072255fc1b58de8941cd45a8a896ed4ebf99b93d2e33"}))
	.withProcess(function(p1, p2) {
		return {
			"btc-usd-amount": p1.amount,
			"eth-usd-amount": p2.amount
		};
	}).withSource(sf.Source("bitcoin-calculation", sf.DataSourceType.LOCAL))
	.withSource(sf.Source("ethereum-calculation", sf.DataSourceType.LOCAL))
)

console.log(JSON.stringify(p));
p.save("/tmp/sf.json")