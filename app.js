////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var util = require('util');

var bleno = require('bleno');
var noble = require('noble');

var serialport = require("serialport");
var SerialPort  = serialport.SerialPort;
var portname, myPort;

var osc = require('node-osc');
var OSC_client = new osc.Client('127.0.0.1', 8080);
var OSC_server = new osc.Server(8081, '0.0.0.0');
OSC_server.on('message',function(msg,rinfo){
  if(msg.length>=3){

    currentVolume = msg[1];
    if(currentVolume<0) currentVolume = 0;
    else if(currentVolume>50) currentVolume = 50;

    currentMode = msg[2];
    if(currentMode<0) currentMode = 0;
    else if(currentMode>3) currentMode = 3;

    updateArduino();
  }
});

var myName = 0;
var nameInterval;

var currentVolume = 0;
var currentMode = 0;
var currentLoudness = 0;

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    start();
  }
});

//////////////////////////////
//////////////////////////////
//////////////////////////////

function setupSerial(){

  serialport.list(function (error, ports) {
    if(!error){
      ports.forEach(function(port) {
        if(port.manufacturer.indexOf('Arduino')>=0 || port.manufacturer.indexOf('FTDI')>=0){
          portname = port.comName;
          console.log(portname);
        }
      });

      if(portname){
        myPort = new SerialPort(portname, { 
          baudRate: 9600,
          open: false,
          parser: serialport.parsers.readline("\r\n")
        });
        createHandlers();
      }
      else{
        console.log('NO ARDUINO PORT FOUND');
      }
    }
  });
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

function createHandlers(){
 
  myPort.on('open', function() {
    console.log('port open');
    myPort.options.open = true;

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
      }
      else if(type==='m'){
        currentMode = value;
      }
      OSC_client.send('/test', currentVolume, currentMode); // send physical input to all speakers over wifi
    });
  });
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

function updateArduino() {
  if (myPort && myPort.options && myPort.options.open) {
    var output = "";
    output += String.fromCharCode(currentVolume);
    output += String.fromCharCode(currentMode);
    output += String.fromCharCode(currentLoudness);
    myPort.write(output); // add a comma for parseInt in Arduino
  }
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function scaler(val,preMin,preMax,postMin,postMax){
  var preDiff = preMax-preMin;
  var postDiff = postMax-postMin;
  return (((val-preMin)/preDiff)*postDiff)+postMin;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function start(){
  setInterval(update, 300);
  noble.startScanning([], true); // start scanning with repeated UUIDs
  bleno.startAdvertising('bleSpeaker');
  setupSerial();
}

function update(){

  if(speaker) speaker.update();
  if(phone) phone.update();
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

noble.on('discover', function(peripheral){
  var tag = peripheral.advertisement.localName;
  if(tag && tag.indexOf('bleSpeaker')>=0){
    handleSpeaker(peripheral); // tag contains that speaker's internal rssi from the phone
  }
  else if(tag && tag.indexOf('Light')>=0){
    handlePhone(peripheral);
  }
});

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var phone, speaker;

function handleSpeaker(p){
  if(!speaker){
    speaker = new Device(p.uuid);
    console.log('found Speaker with UUID --> '+p.uuid);
  }
  speaker.receiveRSSI( p.rssi );
}

function handlePhone(p){
  if(!phone){
    phone = new Device(p.uuid);
    console.log('found a Phone with UUID --> '+p.uuid);
  }
  phone.receiveRSSI(p.rssi);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function Device(_uuid){
  this.uuid = _uuid;
  this.rssi; // raw rssi from node
  this.smoothedRssi = 0; // scaled and smoothed rssi from node (eventually volume)
}

Device.prototype.update = function(){
  var slide = 10;
  // global = global + ( ( new - global ) / slide );
  this.smoothedRssi = this.smoothedRssi + ( (this.rssi - this.smoothedRssi) / slide);
  if(this.smoothedRssi<0) this.smoothedRssi = 0;
}

Device.prototype.receiveRSSI = function(_rssi){
  this.rssi = -1*_rssi;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////