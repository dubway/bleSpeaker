////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var util = require('util');

var noble = require('noble');

var osc = require('node-osc');

var serialport = require("serialport");
var SerialPort  = serialport.SerialPort;
var portname, myPort;

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

noble.on('stateChange', function(state) {
  console.log('Noble -> stateChange: ' + state);
  if (state === 'poweredOn') {
    noble.startScanning([], true); // start scanning with repeated UUIDs
    setupSerial();
  }
});

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

noble.on('discover', function(peripheral){
  var tag = peripheral.advertisement.localName;
  if(tag && tag.indexOf('Light')>=0){
    handlePhone(peripheral);
  }
});

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var phone;

function handlePhone(p){
  if(!phone){
    phone = new Phone(p.uuid);
    console.log('found a Phone with UUID --> '+p.uuid);
  }

  phone.receiveRSSI(p.rssi);

  var output = String.fromCharCode( Math.floor(phone.rssi) );
  serialSend(output);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var currentVolume = 0;
var currentMode = 0;
var currentLoudness = 0;

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function Phone(_uuid){
  this.uuid = _uuid;
  this.rssi = 1; // raw rssi from node
  this.smoothedRssi = 0; // scaled and smoothed rssi from node (eventually volume)
}

Phone.prototype.receiveRSSI = function(_rssi){
  var newVal = -1*_rssi;

  newVal -= 60;
  newVal *= 13;
  if(newVal>255) newVal = 255;
  if(newVal<0) newVal = 0;

  this.rssi = this.rssi + ((newVal-this.rssi) / 10);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var oscClient = new osc.Client('128.122.6.213', 8000);
var oscServer = new osc.Server(8001, '0.0.0.0');

oscServer.on("message", function (msg, rinfo) {
      console.log("OSC message:");
      console.log(msg);
});

function updateOSC(){
  oscClient.send('/someShit',currentMode,currentVolume);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function setupSerial(){

  serialport.list(function (error, ports) {
    if(!error){
      ports.forEach(function(port) {
        if(port.comName.indexOf('Blue')<0){
          myPort = new SerialPort(port.comName, { 
            baudRate: 9600,
            open: false,
            parser: serialport.parsers.readline("\r\n")
          });
          createHandlers();
        }
      });
    }
    if(!myPort){
      myPort = new SerialPort('/dev/ttyAMA0', { 
        baudRate: 9600,
        open: false,
        parser: serialport.parsers.readline("\r\n")
      });
      createHandlers();
      console.log('NO ARDUINO PORT FOUND');
    }
  });
}

function createHandlers(){
 
  myPort.on('open', function() {
    console.log('port open');
    myPort.options.open = true;
    myPort.options.setup = false;

    myPort.on('close', function() {
      console.log('port closed');
      myPort.options.open = false;
    });

    myPort.on('error', function(error) {
      console.log('error on the port, closing it now...');
      myPort.close();
    });

    myPort.on('data', function(data){
      var msg = data.split(',');
      var type = msg[0];
      var value = msg[1];
      if(type==='v'){
        currentVolume = value;
        updateOSC();
      }
      else if(type==='m'){
        currentMode = value;
        updateOSC();
      }
      else if(type==='calibrated'){
        myPort.options.setup = true;
        console.log('calibration complete...');
      }
      else console.log('FROM ARDUINO: '+ data);
    });
  });
}

function serialSend(string) {
  if (myPort && myPort.options && myPort.options.open && myPort.options.setup && string) {
    myPort.write(string);
  }
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////