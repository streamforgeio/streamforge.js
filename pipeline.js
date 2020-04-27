const fs = require('fs');
const winston = require('winston')
const path = require('path');
const datasource = require('./datasource')


var ConflationType = { NONE : "none", CUSTOM : "custom", KEEP_LATEST : "keepLatest", KEEP_EARLIEST : "keepEarliest"};
var DurationType = { SECONDS : "seconds", MINUTES : "minutes", HOURS : "hours"}
var STREAMFORGE_FOLDER = ".streamforge";

function PipelineObject(name,dsType){
    this.name = name;
    if (dsType)
        this.dsType=dsType;
    else 
        this.dsType="kafka"
    this.components = new Array();
}
PipelineObject.prototype.withComponent = function(z){
    if (z["@type"] == 'Broadcast')
        z.boundOut = undefined
    this.components.push(z);
    return this;
}


function getPipelineName(){
    //const fullScriptPath = process.mainModule.filename;
    //fullScriptPath.substring(fullScriptPath.lastIndexOf(path.sep)+1, fullScriptPath.lastIndexOf('.'));
    return "temp";
}

PipelineObject.prototype.compile = function(){
    try {
        fs.mkdirSync(STREAMFORGE_FOLDER)
        winston.log("debug","folder created");
    }catch (e){
        winston.log("error",e.code);
    }
    const pipelineName = getPipelineName();
    winston.log('info',"pipelineName:" + pipelineName);
    fs.writeFile(STREAMFORGE_FOLDER + "/" + pipelineName + ".json", JSON.stringify(this), function(err) {
        if(err) {
            return winston.log('error','Error while saving to ' + path);
        }
        winston.log('info',"The file was saved!");
    });  
},
PipelineObject.prototype.submit = function(){
    // submit to streamforge.io
}

function Pipeline(name,dsType){
    return new PipelineObject(name,dsType);
}

function PipelineComponent(aliasParam){
    this.alias = aliasParam;
    this.conflationContext = { type : ConflationType.NONE};
    this.sinks = new Array();
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
        throttling.durationType = DurationType.SECONDS
    }
    this.throttling = throttling;
    return this;
}

function SinkComponent(aliasParam,additionalProperties){
    this.alias = aliasParam;
    this.additionalProperties = additionalProperties;
}

function APISinkObject(aliasParam,url,additionalProperties){
    SinkComponent.call(this,aliasParam,additionalProperties);
    this["@type"]="APISink"
    this.url = url;
}
APISinkObject.prototype = Object.create(SinkComponent.prototype);

function APISink(alias,url,additionalProperties){
    return new APISinkObject(alias,url,additionalProperties)
}

function RegAPISinkObject(aliasParam){
    SinkComponent.call(this,aliasParam);
    this["@type"]="RegAPISink"
}
RegAPISinkObject.prototype = Object.create(SinkComponent.prototype);

function RegAPISink(alias){
    return new RegAPISinkObject(alias)
}

function WSSinkObject(aliasParam,url,additionalProperties){
    SinkComponent.call(this,aliasParam,additionalProperties);
    this["@type"]="WSSink"
    this.url = url;
}
WSSinkObject.prototype = Object.create(SinkComponent.prototype);

function WSSink(alias,url,additionalProperties){
    return new WSSinkObject(alias,url,additionalProperties)
}

function LogSinkObject(aliasParam){
    SinkComponent.call(this,aliasParam);
    this["@type"]="LogSink"
}
LogSinkObject.prototype = Object.create(SinkComponent.prototype);

function LogSink(alias){
    return new LogSinkObject(alias)
}

function SourceObject(sourceTypeParam,filterFunc,exclusionsParams){
    PipelineComponent.call(this,sourceTypeParam.alias);
    this["@type"]="Source"
    if (filterFunc)
        this.filter = filterFunc.toString();
    this.sourceType = sourceTypeParam;
    this.exclusions = exclusionsParams;
}
SourceObject.prototype = Object.create(PipelineComponent.prototype);

function Source(sourceType,filterFunc,exclusions){
   return new SourceObject(sourceType,filterFunc,exclusions);
}

function Criteria(field, operator, value) {
    this.field = field;
    this.operator = operator;
    this.value = value;
}

function IntermediatePipelineComponent(aliasParam){
    PipelineComponent.call(this,aliasParam);
    this.sources = new Array();
    this.sinks = new Array();
}
IntermediatePipelineComponent.prototype = Object.create(PipelineComponent.prototype);
IntermediatePipelineComponent.prototype.toSink = function(sink){
    if (this["@type"] == 'Broadcast'){
        this.boundOut++;
        sink.source = initializeSource(this.alias + "~" + this.boundOut);
    } else {
        sink.source = initializeSource(this.alias);
    }
    this.sinks.push(sink);
    return this;
}
IntermediatePipelineComponent.prototype.withSource = function(source){
    this.sources.push(initializeSource(source))
    return this;
}

function BroadcastObject(aliasParam,source,outCount){
    IntermediatePipelineComponent.call(this,aliasParam);
    this["@type"]="Broadcast"
    this.sources.push(initializeSource(source));    
    this.outCount = outCount;
    this.boundOut = 0;
}
BroadcastObject.prototype = Object.create(IntermediatePipelineComponent.prototype);

function Broadcast(aliasParam,source,outCount){
    return new BroadcastObject(aliasParam,source,outCount);
}

function MergeObject(aliasParam,inCount){
    IntermediatePipelineComponent.call(this,aliasParam);
    this["@type"]="Merge"  
    this.inCount = inCount;
}
MergeObject.prototype = Object.create(IntermediatePipelineComponent.prototype);

function Merge(aliasParam,inCount){
    return new MergeObject(aliasParam,inCount);
}

function PipelineProcessingComponent(aliasParam){
    IntermediatePipelineComponent.call(this,aliasParam);
    this.func = undefined;
}
PipelineProcessingComponent.prototype = Object.create(IntermediatePipelineComponent.prototype);
PipelineProcessingComponent.prototype.withProcess = function(func){
    this.func = func.toString();
    return this;
}

function ZipObject(aliasParam){
    PipelineProcessingComponent.call(this,aliasParam);
    this["@type"]="Zip"
}
ZipObject.prototype = Object.create(PipelineProcessingComponent.prototype);

function Zip(aliasParam){
    return new ZipObject(aliasParam);
}

function FlowObject(aliasParam){
    PipelineProcessingComponent.call(this,aliasParam);
    this["@type"]="Flow"  
}
FlowObject.prototype = Object.create(PipelineProcessingComponent.prototype);

function Flow(aliasParam){
    return new FlowObject(aliasParam);
}

SourceObject.prototype = Object.create(PipelineComponent.prototype);

function initializeSource(source) {
    if (typeof source === 'string')
        return new Source(datasource.IntermediateSourceType(source));
    else
        return source;
}

module.exports = {
    PredefinedSources : datasource,
    TwitterSourceType : datasource.TwitterSourceType,
    CustomSource : datasource.CustomSourceType,
    DurationType, ConflationType,
    Pipeline,Zip,Source,Criteria,Broadcast,Merge,Flow,
    APISink,WSSink,LogSink,RegAPISink
}