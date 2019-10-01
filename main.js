'use strict';
// ADAPTER <--> IObroker
const utils = require('@iobroker/adapter-core');
var adapter  = utils.Adapter ('dmxface');



// DMXFACE CONNECTION
var IPADR  = "0.0.0.0";
var PORT = 0;
var TIMING = 1000;
var DMX_CHANNELS_USED = 0;
var INPORT =[];
var BUSINPORT= [];
var OUTPORT = [];
var DMX=[];
var AD_INPORT = [];

var OBJID_REQUEST;  // OBJECT ID of TIMED DATA REQUEST

// DMXface TCP Connection
var net = require ('net');
var client = new net.Socket();

// CHECK FLAG true when connection established and free of error
var IS_ONLINE  = false;

adapter.on ('ready',function (){
	//Get the adapter configuration from IObroker
	IPADR = adapter.config.ipaddress;
	PORT = adapter.config.port;
	TIMING = adapter.config.requesttiming; 
	DMX_CHANNELS_USED = parseInt(adapter.config.lastdmxchannel);
	//LIMIT the number of DMX channels max. 224 usable with IObroker
	if (DMX_CHANNELS_USED >224) {DMX_CHANNELS_USED = 224};
	if (DMX_CHANNELS_USED <0) {DMX_CHANNELS_USED = 0};
	adapter.config.lastdmxchannel = DMX_CHANNELS_USED;
	adapter.log.info ('Connecting DMXface ' +IPADR + ' Port:' + PORT + '  Timing:' + TIMING + 'ms  DMXchannels:' + DMX_CHANNELS_USED);

//OBJEKTE initialisieren entweder alle oder aus Config
		var i;
		for (i=1;i<=DMX_CHANNELS_USED;i++){
			adapter.log.info (GetDMX(i));
			adapter.setObjectNotExists (GetDMX(i),{
				type:'state',
					common:{name:'DMX channel'+i ,type:'number',role:'value',read:true,write:true},
					native:{}
			});
		}
		for (i=1;i<=16;i++){
		adapter.setObjectNotExists (GetOUT(i),{
			type:'state',
				common:{name:'OUTPORT'+i,type:'boolean',role:' indicator',read:true,write:true},
				native:{}
		});		
		}
		for (i=1;i<=16;i++){
		adapter.setObjectNotExists (GetIN(i),{
			type:'state',
				common:{name:'INPORT'+i,type:'boolean',role:' indicator',read:true,write:false},
				native:{}
		});		
		}

// Connect the DMXface server
	CONNECT_CLIENT();
// Initialize the request process
	//OBJID_REQUEST = setInterval (CLIENT_REQUEST,TIMING);
	}
	);


// Adapter termination by IObroker
adapter.on ('unload',function (callback){
	adapter.log.info ('DMXface close connection, cancel service');
	//clearInterval (OBJID_REQUEST);
	CLIENT.close;
	callback;
	}
	);


//State Change	
adapter.on ('statechange',function (id,state){
	adapter.log.info ("ID:" + id + " STATE:" + state);
	
});


//Connect the client
function CONNECT_CLIENT () {
	//adapter.log.info('DMXface CONNECTING');
	IS_ONLINE = false;
	client.close;
	client.connect (PORT,IPADR,CBclientCONNECT);
}

//CLIENT CONNECTED callback
function CBclientCONNECT () {
	// Handler
	client.on ('data',CBclientRECEIVE);
	client.on ('error',CBclientERROR);
	adapter.log.info ('DMXface connection established');
	// ONLINE FLAG
	IS_ONLINE = true;
}

	
//todo CLIENT ABFRAGE nur noch für AD PORTS mit allem drum und dran
function CLIENT_REQUEST	(){
	if (IS_ONLINE = true) {
		//nur die AD Ports 
		var WDATA = Buffer.from ([1,2,0,20,224,3]);  // Nur neues Format 16 Bit STX 0x01, LEN LOW, LEN HIGH, x DATBYTES , ETX 0x03
		WDATA[4] = DMX_CHANNELS_USED;
		client.write (WDATA);  // STX , 2 BYTE, CHAR 14 = ABFRAGE / 32 Channels, ETX , Binär ausgeben
	}
}

//CLIENT ERROR HANDLER
function CBclientERROR(Error) {
	IS_ONLINE = false;
	adapter.log.error ("DMXface connection error: " + Error);
}



//------------------------------------------------------ RX DATA PROCESSING --------------------------------------------------------------------
// Prozessing the received ACTIVE SEND data from DMXface 
function CBclientRECEIVE(RXdata) {
	if (RXdata.length < 3) {return;}			// Minimum Length of response ist start 0xF0, Signature 0xnn and at least one data byte 
	
	if (RXdata[0] != 0xF0) {					// CHECK START BYTE =0xF0
		return;
	}
	var i;
	var x;	
	
	switch (RXdata[1]) {
		case 0x01:			// IR RECEIVE 
			break;
		
		case 0x02:   		//RECEIVING INPORT STATE INFO //9 Bytes RX length
			if (RXdata.length == 9){    
				var ONOFF = false;
				x =1;
				for (i=1;i<0x81;i*=2){
					if (i & RXdata[8]){ONOFF = true;} else {ONOFF = false;}
					adapter.setState(GetIN(x),ONOFF);
					if (i & RXdata[7]){ONOFF = true;} else {ONOFF = false;}
					adapter.setState(GetIN(x+8),ONOFF);
					x+=1;
				}
			}
			break;
		
		case 0x04:	//OUTPORT  //5 Bytes RX length
			var ONOFF = false;
			if (RXdata.length == 5){   
				x =1;
				for (i=1;i<0x81;i*=2){
					if (i & RXdata[4]){ONOFF = true;} else {ONOFF = false;}
					adapter.setState(GetOUT(x),ONOFF);
					if (i & RXdata[3]){ONOFF = true;} else {ONOFF = false;}
					adapter.setState(GetOUT(x+8),ONOFF);
					x+=1;
				}
			}
			break;
			
		case 0xFF:	//DMX OUT DATA
			var USED_DXMOUT = (RXdata.length-2);
			if (DMX_CHANNELS_USED < USED_DXMOUT) {
				USED_DXMOUT = DMX_CHANNELS_USED;
				}
			
			for (i=1;i <= USED_DXMOUT;i++){
				adapter.setState(GetDMX(i),RXdata[i+1]);				
				}
			break;
			
		default:
			return;
			break;
	}

	
}


function GetDMX (number){
	if (number <10) {return 'DMX00'+number;}
	if (number <100) {return 'DMX0'+number;}
	return 'DMX'+number;
}
function GetOUT (number){
	if (number <10) {return 'OUTPORT0'+number;}
	return 'OUTPORT'+number;
}
function GetIN (number){
	if (number <10) {return 'INPORT0'+number;}
	return 'INPORT'+number;
}

