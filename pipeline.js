const fs = require('fs');
const winston = require('winston')

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
    this.conflation = "";
}
PipelineComponent.prototype.withConflation = function(conflateFunc){
    this.conflation = conflateFunc.toString();
    return this;
}

function SourceObject(aliasParam,criteriaParam,maskParam){
    PipelineComponent.call(this,aliasParam);
    this.criteria = criteriaParam;
    this.mask = maskParam;
    this.process = ""
}
SourceObject.prototype.withProcess = function(process){
    this.process = process.toString();
    return this;
}
/*SourceObject.prototype.toJSON = function(){
    return JSON.stringify({
        "alias" : this.alias,
        "mask" : this.mask,
        "criteria" : this.criteria,
        "process" : 
    });
}*/
SourceObject.prototype = Object.create(PipelineComponent.prototype);

function Source(alias,criteria,mask){
   return new SourceObject(alias,criteria,mask);
}

function Criteria(field, operator, value) {
    this.field = field;
    this.operator = operator;
    this.value = value;
}

function PipelineProcessingComponent(aliasParam){
    PipelineComponent.call(this,aliasParam);
    this.process = function(){};
}
PipelineProcessingComponent.prototype = Object.create(PipelineComponent.prototype);
PipelineProcessingComponent.prototype.withProcess = function(func){
    process = func;
    return this;
}

function ZipObject(aliasParam){
    PipelineProcessingComponent.call(this,aliasParam);
    this.sources = new Array();
}
ZipObject.prototype = Object.create(PipelineProcessingComponent.prototype);

ZipObject.prototype.withSource = function(source){
    this.sources.push(source);
    return this;
}

function Zip(aliasParam){
    return new ZipObject(aliasParam);
}


SourceObject.prototype = Object.create(PipelineComponent.prototype);


module.exports = {Pipeline,Zip,Source,Criteria}