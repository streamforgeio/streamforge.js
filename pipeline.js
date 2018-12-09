const fs = require('fs');
const winston = require('winston')


var DataSourceType = { GLOBAL : "global", LOCAL : "local"};

function PipelineObject(){
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

function Pipeline(){
    return new PipelineObject();
}

function PipelineComponent(aliasParam){
    this.alias = aliasParam;
    this.conflation = undefined;
}
PipelineComponent.prototype.withConflation = function(conflateFunc){
    this.conflation = conflateFunc.toString();
    return this;
}

function SourceObject(aliasParam,typeParam,filterParam,exclusionsParam){
    PipelineComponent.call(this,aliasParam);
    this.filter = filterParam;
    this.exclusions = exclusionsParam;
    this.type = typeParam;
}
SourceObject.prototype = Object.create(PipelineComponent.prototype);

function Source(alias,type,criteria,mask){
   return new SourceObject(alias,type,criteria,mask);
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
    DataSourceType,
    Pipeline,Zip,Source,Criteria
}