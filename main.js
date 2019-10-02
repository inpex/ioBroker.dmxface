'use strict';
// ADAPTER <--> IObroker
const utils = require('@iobroker/adapter-core');
var adapter  = utils.Adapter ('dmxface');



// DMXFACE CONNECTION
var IPADR  = "0.0.0.0";
var PORT = 0;
var TIMING = 1000;
var DMX_CHANNELS_USED = 0;
var BUSINPORT= [];
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

//Initialize the state objects
		var i;
		//DMX CHANNELS
		for (i=1;i<=DMX_CHANNELS_USED;i++){
			adapter.setObjectNotExists (GetDMX(i),{
				type:'state',
					common:{name:'DMX channel'+i ,type:'number',role:'value',read:true,write:true},
					native:{}
			});
		}
		//OUTPORTS
		for (i=1;i<=16;i++){
		adapter.setObjectNotExists (GetOUT(i),{
			type:'state',
				common:{name:'OUTPORT'+i,type:'boolean',role:'value',read:true,write:true},
				native:{}
		});		
		}
		//INPORTS
		for (i=1;i<=16;i++){
		adapter.setObjectNotExists (GetIN(i),{
			type:'state',
				common:{name:'INPORT'+i,type:'boolean',role:'value',read:true,write:false},
				native:{}
		});		
		}
		
		//IR REMOTE RECEIVE
		adapter.setObjectNotExists ('IR_RECEIVE',{
			type:'state',
				common:{name:'IR REMOTE RECEIVE',type:'string',role:'value',read:true,write:false},
				native:{}
		});		
		
		//SCENEN CALLER 
		adapter.setObjectNotExists ('SCENE_CALL',{
			type:'state',
				common:{name:'SCENE NUMBER CALL',type:'number',role:'value',read:true,write:false},
				native:{}
		});		
		
		//PROGRAM CALLER 
		adapter.setObjectNotExists ('PROGRAM_CALL',{
			type:'state',
				common:{name:'PROGRAM NUMBER CALL',type:'number',role:'value',read:true,write:false},
				native:{}
		});		
		
		
		//BUS_INPORTS
		for (i=1;i<=32;i++){
			adapter.setObjectNotExists (GetBUS(i),{
			type:'state',
			common:{name:'BUS IO'+i,type:'boolean',role:'value',read:true,write:true},
			native:{}
		});		
		}
		
		adapter.subscribeStates('*');
// Connect the DMXface server
		CONNECT_CLIENT();
// Initialize the request process
	//OBJID_REQUEST = setInterval (CLIENT_REQUEST,TIMING);
});



// Adapter termination by IObroker
adapter.on ('unload',function (callback){
	adapter.log.info ('DMXface close connection, cancel service');
	//clearInterval (OBJID_REQUEST);
	CLIENT.close;
	callback;
	});


//State Changes	
adapter.on ('stateChange',function (id,obj){
	if (obj.from.search ('dmxface') != -1) {return;}    // do not process self generated state changes (by dmxface instance) 
														//exit if sender = dmxface
	var PORTSTRING = id.substring(10);  //remove Instance name
	// if (PORTSTRING[0] ='.'){PORTSTRING = id.substring(11);  optional Removal if more than 10 Instances are used 
	
	//Select the Type by the first character of the PORTSTRING 
	//'O' OUTPORT , 'D' DMX, 'B' BUSINPORT   ,, INPORT and IR_RECEIVE cannot be set 
	var PORTNUMBER =-1
	var WDATA 
	switch (PORTSTRING[0]) {
		case 'O':		//OUTPORT
			var PORTNUMBER = parseInt(PORTSTRING.substring(7));
			WDATA= Buffer.from ([0xF0,0x4F,(PORTNUMBER & 0xFF),0]);  // DMXFACE ACTIVE SEND Command switch Portnumber to OFF
			if (obj.val ==true) {WDATA[3] = 1;}						// IF TRUE then ON 
			client.write (WDATA); 
			break;
			
		case 'D':		//DMX CHANNEL
			var PORTNUMBER = parseInt(PORTSTRING.substring(3));
			WDATA= Buffer.from ([0xF0,0x44,0x00,(PORTNUMBER &0xFF),obj.val]);  // DMXFACE ACTIVE SEND Command SET DMX CHANNEL
			client.write (WDATA); 
			break;
		case 'B':	 //BUS IO will be implemented 
			var PORTNUMBER = parseInt(PORTSTRING.substring(3));
			PORTNUMBER+=24;
			WDATA= Buffer.from ([0xF0,0x4F,(PORTNUMBER & 0xFF),0]);  // DMXFACE ACTIVE SEND BUS IO
			if (obj.val ==true) {WDATA[3] = 1;}						// IF TRUE then ON 
			client.write (WDATA); 
			break;
		case 'S':  //SCENE CALLER  
			var SCENE_NUMBER = obj.val;
			if (SCENE_NUMBER < 1){return;}
			if (SCENE_NUMBER > 180){return;}
			WDATA= Buffer.from ([0xF0,0x53,SCENE_NUMBER]);  // DMXFACE ACTIVE SEND BUS IO
			client.write (WDATA); 
			break;
		
		case 'P':  //PROGRAM CALLER  
			var PG_NUMBER = obj.val;
			if (PG_NUMBER < 1){return;}
			if (PG_NUMBER > 28){return;}
			WDATA= Buffer.from ([0xF0,0x50,PG_NUMBER]);  // DMXFACE ACTIVE SEND BUS IO
			client.write (WDATA); 
			break;
		default:
			return;
			break;
	}
			
		


	
	

	
	
	
	
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
	adapter.setState ('info.connection',true,true);
	adapter.log.info ('DMXface connection established');
	// ONLINE FLAG
	IS_ONLINE = true;
}

	
//AKTUELL NICHT GEBRAUCHT 
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
		case 0x01:			// IR CODE 10 Bytes received, 8 Bytes IR Code
			if (RXdata.length == 10){    
				var BUFF = "";
				var IRCODE = "";
				for (i=2;i<10;i++){
					BUFF = RXdata[i].toString(16).toUpperCase();
					//BUFF = BUFF.toUpperCase;
					if (BUFF.length <2) {IRCODE += '0'+BUFF} else {IRCODE += BUFF}
				}
				adapter.setState('IR_RECEIVE',IRCODE,false);
			}
			
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
					//if (i & RXdata[6]){ONOFF = true;} else {ONOFF = false;}
					//adapter.setState(GetIN(x+16),ONOFF);
					if (i & RXdata[5]){ONOFF = true;} else {ONOFF = false;}
					adapter.setState(GetBUS(x),ONOFF);
					if (i & RXdata[4]){ONOFF = true;} else {ONOFF = false;}
					adapter.setState(GetBUS(x+8),ONOFF);
					if (i & RXdata[3]){ONOFF = true;} else {ONOFF = false;}
					adapter.setState(GetBUS(x+16),ONOFF);
					if (i & RXdata[2]){ONOFF = true;} else {ONOFF = false;}
					adapter.setState(GetBUS(x+24),ONOFF);
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

function GetBUS (number){
	if (number <10) {return 'BUS0'+number;}
	return 'BUS'+number;
}