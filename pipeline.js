const fs = require('fs');
const winston = require('winston')


var DataSourceScope = { GLOBAL : "global", LOCAL : "local"};
var ConflationType = { NONE : "none", CUSTOM : "custom", KEEP_LATEST : "keepLatest", KEEP_EARLIEST : "keepEarliest"};
var DurationType = { SECOND : "second", MINUTE : "minute", HOUR : "hour"}

function PipelineObject(dsType){
    if (dsType)
        this.dsType=dsType;
    else 
        this.dsType="kafka"
    this.components = new Array();
}
PipelineObject.prototype.withComponent = function(z){
    this.components.push(z);
    return this;
}
PipelineObject.prototype.save = function(path){
    fs.writeFile(path, JSON.stringify(this), function(err) {
        if(err) {
            return winston.log('error','Error while saving to ' + path);
        }
        winston.log('info',"The file was saved!");
    });             
},
PipelineObject.prototype.submit = function(){
    // submit to streamforge.io
}

function Pipeline(dsType){
    return new PipelineObject(dsType);
}

function PipelineComponent(aliasParam){
    this.alias = aliasParam;
    this.conflationContext = { type : ConflationType.NONE};
}
PipelineComponent.prototype.withConflation = function(conflation){
    var conflationContext = new Object();
    if (typeof conflation === 'function'){
        conflationContext.type = ConflationType.CUSTOM
        conflationContext.func = conflation.toString();
    } else if (typeof conflation === 'string'){
        conflationContext.type = conflation
    }
    this.conflationContext = conflationContext;
    return this;
}

PipelineComponent.prototype.withThrottling = function(count,duration, durationType){
    var throttling = new Object();
    throttling.count = count
    throttling.duration = duration
    if (durationType){
        throttling.durationType = durationType
    }else {
        throttling.durationType = DurationType.SECOND
    }
    this.throttling = throttling;
    return this;
}

function SinkComponent(aliasParam,sourceParam,additionalProperties){
    this.alias = aliasParam;
    this.source = sourceParam;
    this.additionalProperties = additionalProperties;
}

function APISinkObject(aliasParam,sourceParam,url,additionalProperties){
    SinkComponent.call(this,aliasParam,sourceParam,additionalProperties);
    this["@type"]="APISink"
    this.url = url;
}
APISinkObject.prototype = Object.create(SinkComponent.prototype);

function APISink(alias,source,url,additionalProperties){
    return new APISinkObject(alias,source,url,additionalProperties)
}

function WSSinkObject(aliasParam,sourceParam,url,additionalProperties){
    SinkComponent.call(this,aliasParam,sourceParam,additionalProperties);
    this["@type"]="WSSink"
    this.url = url;
}
WSSinkObject.prototype = Object.create(SinkComponent.prototype);

function WSSink(alias,source,url,additionalProperties){
    return new WSSinkObject(alias,source,url,additionalProperties)
}

function SourceObject(aliasParam,scopeParam,filterFunc,exclusionsParams){
    PipelineComponent.call(this,aliasParam);
    this["@type"]="Source"
    if (filterFunc)
        this.filter = filterFunc.toString();
    this.exclusions = exclusionsParams;
    this.scope = scopeParam;
}
SourceObject.prototype = Object.create(PipelineComponent.prototype);

function Source(alias,scope,filterFunc,exclusions){
   return new SourceObject(alias,scope,filterFunc,exclusions);
}

function Criteria(field, operator, value) {
    this.field = field;
    this.operator = operator;
    this.value = value;
}

function PipelineProcessingComponent(aliasParam){
    PipelineComponent.call(this,aliasParam);
    this.func = undefined;
}
PipelineProcessingComponent.prototype = Object.create(PipelineComponent.prototype);
PipelineProcessingComponent.prototype.withProcess = function(func){
    this.func = func.toString();
    return this;
}
PipelineProcessingComponent.prototype.toSink = function(sink){
    this.sink = sink;
    return this;
}

function ZipObject(aliasParam,isFinal){
    PipelineProcessingComponent.call(this,aliasParam,isFinal);
    this["@type"]="Zip"
    this.sources = new Array();
}
ZipObject.prototype = Object.create(PipelineProcessingComponent.prototype);

ZipObject.prototype.withSource = function(source){
    this.sources.push(source);
    return this;
}

function Zip(aliasParam,isFinal){
    return new ZipObject(aliasParam,isFinal);
}

SourceObject.prototype = Object.create(PipelineComponent.prototype);

module.exports = {
    DataSourceType: DataSourceScope,ConflationType,
    Pipeline,Zip,Source,Criteria,APISink,WSSink
}