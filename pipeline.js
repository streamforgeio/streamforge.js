const fs = require('fs');
const winston = require('winston')


var DataSourceScope = { GLOBAL : "global", LOCAL : "local"};
var ConflationType = { KEEP_LATEST : "keepLatest", KEEP_EARLIEST : "keepEarliest"};

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
    this.conflation = undefined;
}
PipelineComponent.prototype.withConflation = function(conflation){
    var conflationContext = new Object();
    if (typeof conflation === 'object'){
        conflationContext.type = conflation.type 
        conflationContext.func = conflation.conflateFunc.toString();
    } else if (typeof conflation === 'string'){
        conflationContext.type = conflation
    }
    this.conflationContext = conflationContext;
    return this;
}

function SourceObject(aliasParam,scopeParam,filterFunc,exclusionsParams){
    PipelineComponent.call(this,aliasParam);
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

function PipelineProcessingComponent(aliasParam, isFinal){
    PipelineComponent.call(this,aliasParam);
    this.process = undefined;
    this.final = isFinal;
}
PipelineProcessingComponent.prototype = Object.create(PipelineComponent.prototype);
PipelineProcessingComponent.prototype.withProcess = function(func){
    this.process = func.toString();
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
    Pipeline,Zip,Source,Criteria
}