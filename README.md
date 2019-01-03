# StremForge.IO

StreamForge.io is a javascriptframework that enables you to process streams from multiple stream sources.

##Sample

Here we are calculating total BTC and Eth transactions over USD (ICO exchange rates are retrieved from bitfinex) 

```javascript
const sf = require('./pipeline.js');

var p = sf.Pipeline().withComponent(
                            sf.Zip("bitcoin-calculation")
                                .withProcess(function(p1,p2){
                                                            if (p1.vout.length == 0)
                                                                return {'amount' : 0}
                                                            var r = { 'amount': (p1.vout[0].amount * p2.body.result.price.last ) /1000000 } 
                                                            return r;
                                                        })
                                .withSource(
                                    sf.Source("btc-raw",sf.DataSourceType.GLOBAL)
                                )
                                .withSource(
                                    sf.Source("ico-parity",sf.DataSourceType.GLOBAL,function(s){ return s.ico == 'btc' 
                                                                                                        && s.currency == 'usd' 
                                                                                                        && s.market == 'bitfinex'; })
                                )
                    ).withComponent(
                                sf.Zip("ethereum-calculation")
                                .withProcess(function(p1,p2){
                                                            var r = { 'amount': (p1.gas * p2.body.result.price.last ) /1000000 } 
                                                            return r;
                                                        })
                                .withSource(
                                    sf.Source("eth-pending",sf.DataSourceType.GLOBAL).withConflation(function(s1,s2){
                                                return {'gas': (s1.gas + s2.gas) }
                                            })
                                )
                                .withSource(
                                    sf.Source("ico-parity",sf.DataSourceType.GLOBAL,function(s){ return s.ico == 'eth' 
                                                                                                        && s.currency == 'usd' 
                                                                                                        && s.market == 'bitfinex'; })
                                )
                    ).withComponent(
                                sf.Zip("Combine",true )
                                .withProcess(function(p1,p2){
                                    return { "btc-usd-amount" : p1.amount, "eth-usd-amount" : p2.amount};
                                }).withSource(sf.Source("bitcoin-calculation",sf.DataSourceType.LOCAL))
                                .withSource(sf.Source("ethereum-calculation",sf.DataSourceType.LOCAL))
                    )
                            
console.log(JSON.stringify(p));
p.save("/tmp/sf.json")



```  

### Sources 

* Bitcoin Transaction ;  

```javascript

{
	"txId": "2ac16c33611615b5334b18a17319ab5f107991c3270a6a0ecb9dafb7f5fb8fd7",
	"vout": [{
			"address": "1H7MxJ1JkENzWRoZoUzXSgZrj3LF1RuuP7",
			"amount": 313830443
		},
		{
			"address": "1CVHsic6BSFBN7gMKd5yWrJXEDofcYy7Zp",
			"amount": 4279181
		}
	]
}
```  

Source Configuration ;

```javascript
sf.Source("btc-raw",sf.DataSourceType.GLOBAL)
```  
**btc-raw** is a topic of BTC transactions and it is a global datasource. (Local  datasources are the datasource created within the current pipeline.)

* Ethereum Transaction 

```javascript

{
	"blockHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
	"blockNumber": null,
	"from": "0xbE1085bc3e0812F3dF63dEcED87e29b3BC2db524",
	"gas": 74511,
	"gasPrice": "1000000000",
	"hash": "0x527ba06e49201b11d2e9fd3fcace24ac98b58f1cfbbae8ee11f4d713be6882ce",
	"input": "0xbaa476944ecad06052930a6be4774e7fea1b75d1e3a21a677e5ff4cf9053da7bba83313b",
	"nonce": 1132378,
	"r": "0x894c64e4532e7fa1f409544174ab683d6c50d3a106b410eaf5f86d01d77572a2",
	"s": "0x3ac7901fc78c290261218cd633ab1e37df7f120b17c315d0a54a1b10821748dd",
	"to": "0x40af244C94E679aebf897512720A41d843954A29",
	"transactionIndex": 0,
	"v": "0x1b",
	"value": "0"
}

```   
```javascript
sf.Source("eth-pending",sf.DataSourceType.GLOBAL).withConflation(function(s1,s2){
                                                return {'gas': (s1.gas + s2.gas) }})
```  
**eth-pending** is a topic of Ethereum pending transactions and it is a global datasource.  
  
**Conflation** is function to reduce the stream data till its time of calculation comes.For ethereum pending we are summing up all the gas amounts.

* ICO parity   

```javascript
{
	"market": "bitfinex",
	"ico": "eth",
	"currency": "usd",
	"body": {
		"result": {
			"price": {
				"last": 153.24,
				"high": 163.67,
				"low": 151.79,
				"change": {
					"percentage": -0.0053871614,
					"absolute": -0.83
				}
			},
			"volume": 493807.13395904,
			"volumeQuote": 77722632.58610716
		},
		"allowance": {
			"cost": 1439514,
			"remaining": 7993840675
		}
	}
}
``` 
Source Configuration;

For Ethereum ;  

```javascript

 sf.Source("ico-parity", sf.DataSourceType.GLOBAL, function(s) {
 			return s.ico == 'eth' &&
 				s.currency == 'usd' &&
 				s.market == 'bitfinex';
 		}
```
For Bitcoin ;  

```javascript

 sf.Source("ico-parity", sf.DataSourceType.GLOBAL, function(s) {
 			return s.ico == 'eth' &&
 				s.currency == 'usd' &&
 				s.market == 'bitfinex';
 		}
```

We are filtering bitfinex market values, ico types and exchange type(USD). 

### Process

...btc-trx   .........................-->  
...............................................bitcoin-calculation ..-->  
...ico-parity(for btc) ........-->  
.............................................................................................Combine  
...eth-pending   ...........-->  
........................................ethereum-calculation ....-->  
...ico-parity(for eth)....-->

Zip Configuration

Zip is used to process all the inputs at the same time and produces single output.

```javascript

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
 	
```
Produces an output of product of BTC transaction amount and ico USD rate.

```javascript

sf.Zip("ethereum-calculation")
	.withProcess(function(p1, p2) {
		var r = {
			'amount': (p1.gas * p2.body.result.price.last) / 1000000
		}
		return r;
	})
 	
```
Produces an output of product of ETH transaction amount and ico USD rate.  

```javascript

sf.Zip("Combine", true)
	.withProcess(function(p1, p2) {
			return {
				"btc-usd-amount": p1.amount,
				"eth-usd-amount": p2.amount
			};
		}
 	
```

Combines both amounts of ethereum and bitcoin transactions.

## Integrations

Out of box Sinks are ;

* Simple Sink, just finalize the stream flow, does nothing
* Push notification sink
	* Custom Push Notification
	* Streamforge App Push Notification	 
* WebSocket Sink
* WebHook Sink
* RDBMS Sink
* S3 Sink
* NoSQL Sink
* API Sink , a generic built-in sink type. (Also API library can be used in the js file.)


##Sample Datasources

* ICO
    * Bitcoin  
        * Rates  
        * Transfers  
    * Etherium  
        * Rates
        * Transfers 
* Stocks
    * IMKB Stock Prices
    * Nasdaq
* Tweeter
* CloudWatch



Competitors:   

* [Qundl](https://www.quandl.com/) :  
    * Study
        * Review what kind of data they have. 
* [Getstream.io](https://getstream.io/) :
    * Notification, Activity feeds and personalization functions  
    * Study
        * Review pricing
        * Review Customers 
* Streamr