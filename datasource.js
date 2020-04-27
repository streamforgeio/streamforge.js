const ETHEREUM_PENDING_TRANSACTIONS_ALIAS = "eth-pending";
const ICO_PARITY_ALIAS = "ico-parity";
const BITCOIN_TRANSACTIONS_ALIAS = "btc-raw";
const TWITTER_ALIAS = "twitter";

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

function OndemandSourceTypeObject(alias, identifier, ...params){
    SourceTypeObject.call(this, alias, DataSourceScope.GLOBAL);
    this["@type"]="Predefined";
    this.params = params;
    this.identifier = identifier;
}
OndemandSourceTypeObject.prototype = Object.create(SourceTypeObject.prototype);

function OndemandSourceType(alias, identifier, ...params){
    return new OndemandSourceTypeObject(alias, identifier, params);
 }


function TwitterSourceTypeObject(identifier, ...params){
    OndemandSourceTypeObject.call(this, TWITTER_ALIAS, identifier, params);
    this["@type"]="Twitter";
    
}
TwitterSourceTypeObject.prototype = Object.create(SourceTypeObject.prototype);

function TwitterSourceType(...params){
    return new TwitterSourceTypeObject(params);
 }

function CustomSourceTypeObject(alias, identifier, ...params){
    OndemandSourceTypeObject.call(this, alias, identifier, params);
    this["@type"]="Custom";
}
CustomSourceTypeObject.prototype = Object.create(SourceTypeObject.prototype);

function CustomSourceType(alias, identifier,...params){
    return new CustomSourceTypeObject(alias, identifier, params);
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
    TwitterSourceType: TwitterSourceType,
    CustomSourceType: CustomSourceType,
    IntermediateSourceType: IntermediateSourceType
}