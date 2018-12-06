const fs = require('fs');
const winston = require('winston')


function Pipeline(){
    const components = new Array();
    return {
        withComponent: function(z){
            components.push(z.jsonObject());
            return this;
        },
        jsonObject: function(){
            return {
                "components" : components
            }
        },
        save: function(path){
            fs.writeFile(path, JSON.stringify(this.jsonObject()), function(err) {
                if(err) {
                    return winston.log('error','Error while saving to ' + path);
                }
                winston.log('info',"The file was saved!");
            });             
        },
        submit : function(){
            // submit to streamforge.io
        }

    }


}

function Zip(aliasParam){
    console.log("falan filan");
    const alias = aliasParam;
    var process = "";
    const sources = new Array();
    return {
        withSource: function(source){
            sources.push(source);
            return this;
        },
        withProcess: function(func){
            process = func;
            return this;
        },
        jsonObject: function(){
            return {
                "alias" : alias,
                "process" : process.toString(),
                "sources" : sources
            }
        }

    }


}


function Source(alias,criteria,mask){
    return {
        "alias" :  alias,
        "criteria" : criteria,
        "mask" : mask
    }
}


function Criteria(field, operator, value) {
    return {
        "field" : field,
        "operator" : operator,
        "value" : value
    }
}



module.exports = {Pipeline,Zip,Source,Criteria}