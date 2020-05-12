const ETHEREUM_PENDING_TRANSACTIONS_ALIAS = "eth-pending";
const ICO_PARITY_ALIAS = "ico-parity";
const BITCOIN_TRANSACTIONS_ALIAS = "btc-raw";
const TWITTER_ALIAS = "twitter-sentiment-dsod:0.0.2";

var DataSourceScope = { GLOBAL : "global", LOCAL : "local"};

function SourceTypeObject(alias, scope){
    this.alias = alias;
    this.scope = scope;
}

function SourceType(alias, scope ){
   return new SourceTypeObject(alias, scope);
}

function PredefinedSourceTypeObject(alias){
    SourceTypeObject.call(this, alias, DataSourceScope.GLOBAL);
    this["@type"]="Predefined";
    
}
PredefinedSourceTypeObject.prototype = Object.create(SourceTypeObject.prototype);

function PredefinedSourceType(alias){
    return new PredefinedSourceTypeObject(alias);
 }

function OndemandSourceTypeObject(alias, params){
    SourceTypeObject.call(this, alias, DataSourceScope.GLOBAL);
    this["@type"]="Ondemand";
    this.params = params;
}
OndemandSourceTypeObject.prototype = Object.create(SourceTypeObject.prototype);

function OndemandSourceType(alias, params){
    return new OndemandSourceTypeObject(alias, params);
}

function ParamObject(key,value){
    this.key = key;
    this.value = value;
}

function Param(key,value){
    return new ParamObject(key,value);
 }


function IntermediateSourceTypeObject(alias){
    SourceTypeObject.call(this, alias, DataSourceScope.LOCAL);
    this["@type"]="Intermediate";
    
}
IntermediateSourceTypeObject.prototype = Object.create(SourceTypeObject.prototype);

function IntermediateSourceType(alias){
    return new IntermediateSourceTypeObject(alias);
 }

const ETHEREUM_PENDING_TRANSACTIONS = new PredefinedSourceType(ETHEREUM_PENDING_TRANSACTIONS_ALIAS);
const ICO_PARITY = new PredefinedSourceType(ICO_PARITY_ALIAS);
const BITCOIN_TRANSACTIONS = new PredefinedSourceType(BITCOIN_TRANSACTIONS_ALIAS);

module.exports = {
    ETHEREUM_PENDING_TRANSACTIONS,
    ICO_PARITY,
    BITCOIN_TRANSACTIONS,
    TwitterSentiment: function(...params) { return new OndemandSourceType(TWITTER_ALIAS,params)} ,
    OndemandSourceType: OndemandSourceType,
    IntermediateSourceType: IntermediateSourceType,
    Param : Param
}