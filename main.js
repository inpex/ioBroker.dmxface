'use strict';

const utils = require('@iobroker/adapter-core');
var adapter  = utils.Adapter ('dmxface');



// DMXFACE CONNECTION
var IPADR  = "0.0.0.0";
var PORT = 5000;
var TIMING = 1000;
var DMX_CHANNELS_USED = 224;
var INPORT =[];
var BUSINPORT= [];
var OUTPORT = [];
var DMX=[];
var AD_INPORT = [];

var OBJID_REQUEST;

// INTERNE
var net = require ('net');
var client = new net.Socket();

// CHECK FLAG ob ONLINBE
var IS_ONLINE  = false;

adapter.on ('ready',function (){
	IPADR = adapter.config.ipaddress;
	PORT = adapter.config.port;
	TIMING = adapter.config.requesttiming; 
	DMX_CHANNELS_USED = parseInt(adapter.config.lastdmxchannel);
	//MAX LIMIT DMX CHANNELS, ist mit der ABFRAGE x14 auf 255 Channels begrenzt
	if (DMX_CHANNELS_USED >255) {DMX_CHANNELS_USED = 255};
	if (DMX_CHANNELS_USED <0) {DMX_CHANNELS_USED = 0};
	adapter.config.lastdmxchannel = DMX_CHANNELS_USED;
	adapter.log.info ('Connecting DMXface ' +IPADR + ' Port:' + PORT + '  Timing:' + TIMING + 'ms  DMXchannels:' + DMX_CHANNELS_USED);


// Verbinden des Client
	CONNECT_CLIENT();
//ABFRAGE PROZESS initialisieren
	OBJID_REQUEST = setInterval (CLIENT_REQUEST,TIMING);
	}
	);

adapter.on ('unload',function (callback){
	adapter.log.info ('DMXface close connection, cancel service');
	clearInterval (OBJID_REQUEST);
	CLIENT.close;
	callback;
	}
	);


	



//Client verbinden  
function CONNECT_CLIENT () {
	//adapter.log.info('DMXface CONNECTING');
	IS_ONLINE = false;
	client.close;
	client.connect (PORT,IPADR,CBclientCONNECT);
}

//Event CLIENT CONNECTED
function CBclientCONNECT () {
	// Handler
	client.on ('data',CBclientRECEIVE);
	client.on ('error',CBclientERROR);
	adapter.log.info ('DMXface connection established');
	// ONLINE FLAG
	IS_ONLINE = true;
}

	
//CLIENT ABFRAGE 
function CLIENT_REQUEST	(){
	if (IS_ONLINE = true) {
		//PORTS und DMX Kanäle bis zu 224
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
// RX DATEN verarbeiten 
function CBclientRECEIVE(RXdata) {
	var CMD_REFLECT = 0;
	var CMD_OPTION = 0;
	var DATA_POSITION = 0;
	var DATA_LEN = 0;
	//console.log ('ENTER RX' );
	if (RXdata.length < 6) {return;}			// Minimum Length of response STX 0x01 ,LEN LOW, LEN HIGH, 0 Bytes DATA ,CMD_REFLECT,CMD_OPTION,ETX	console.log ('DATA2:' + RXdata[2]);
	
	if (RXdata[0] = 0x01) {						// CHECK START BYTE 0x01 qwith 16 Bit Length or 0x02 with 8 Bit Length
		DATA_POSITION = 3;
		DATA_LEN =  (RXdata[1] + (RXdata[2]<<8));  //UNBEDINGT in Klammern sonst wird falsch gerechnet
	}
	if (DATA_POSITION == 0) {return;} 			//nicht gesetzt da ungültiges Startzeichen
	
	
	//COMMAND REFLECTION und RX Zurordnung	
	CMD_REFLECT = (RXdata[RXdata.length-3]);	// Extract Command Reflection must be Value 
	if (CMD_REFLECT <= 0x80) {return;}			// Must be Value > 0x80
	CMD_REFLECT = (CMD_REFLECT & 0x7F);    		// Extract the Source command 
	CMD_OPTION = RXdata[RXdata.length-2];		// Extract the option byte
	
	
	switch (CMD_REFLECT) {
		case 0x14:   // KOMMANDO zur ABFRAGE aller INPORTS und DMX bis zu 255 Channels in einem Request (siehe Communication Manual) 
			//OUTPORT
			var i;
			var x;
			
			for (i=0;i<8;i++){
				x=2**i;					//2 hoch i
				
				//OUTPORT 1-8 steht auf Byte 4 (offset 3)
				if (x & RXdata[DATA_POSITION+3]) {
					OUTPORT[i] = true;
					} else { 
					OUTPORT[i] = false;
				}
				
				//OUTPORT 9-16 steht auf Byte 3 (offset 2)
				if (x & RXdata[DATA_POSITION+2]) {
					OUTPORT[i+8] = true;
					} else { 
					OUTPORT[i+8] = false;
				}
				
				//INPORT IN1-8 auf Byte 16 (Offset 15) INPORT 9-16 auf Byte 15 ; (Inport 17-24 auf Byte 14)
			    if (x & RXdata[DATA_POSITION+15]) {
					INPORT[i] = true;
					} else { 
					INPORT[i] = false;
				}
								
				//INPORT IN9-16 auf Byte 15 (Offset 14) 
			    if (x & RXdata[DATA_POSITION+14]) {
					INPORT[i+8] = true;
					} else { 
					INPORT[i+8] = false;
				}
				//nicht implementiert INPORT IN17-24 auf Byte 14 (Offset 13) 
			
			    //BUS 1.x auf BYTE 12 
				if (x & RXdata[DATA_POSITION+11]) {
					BUSINPORT[i] = true;
					} else { 
					BUSINPORT[i] = false;
				}
				 //BUS 2.x auf BYTE 11 
				if (x & RXdata[DATA_POSITION+10]) {
					BUSINPORT[i+8] = true;
					} else { 
					BUSINPORT[i+8] = false;
				}
				 //BUS 3.x auf BYTE 10 
				if (x & RXdata[DATA_POSITION+9]) {
					BUSINPORT[i+16] = true;
					} else { 
					BUSINPORT[i+16] = false;
				}
				//BUS 4.x auf BYTE 9 
				if (x & RXdata[DATA_POSITION+8]) {
					BUSINPORT[i+24] = true;
					} else { 
					BUSINPORT[i+24] = false;
				}
			}
			//DMX CHANNELS 1-n auf Byte 33 (Offset 32)
			for (i=0;i < DMX_CHANNELS_USED;i++){
			DMX[i] = RXdata[i+32+DATA_POSITION]	
			}
			
			//AD_INPORTs 1-16 ab BYTE 17 (offset 16)
			for (i=0;i < 16;i++){
			AD_INPORT[i] = RXdata[i+16+DATA_POSITION]		
			}
		break;
		
		//case nächster:
		
		default:
			return;
			break;
	}

	
}

