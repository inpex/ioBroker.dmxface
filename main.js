'use strict';

const adaptername = require('./package.json').name.split('.').pop();
const utils = require('@iobroker/adapter-core');
var adapter  = utils.Adapter (adaptername);

//*************************************  ADAPTER STARTS with ioBroker *******************************************
adapter.on ('ready',function (){

});

//************************************* ADAPTER CLOSED BY ioBroker *****************************************
adapter.on ('unload',function (callback){

});

//************************************* ADAPTER OBJECT CHANGE BY ioBroker *****************************************
adapter.on('objectChange', (id, obj) => {

});

//************************************* Adapter STATE has CHANGED ******************************************	
adapter.on ('stateChange',function (id,obj){

});