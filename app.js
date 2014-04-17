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
var client = new osc.Client('127.0.0.1', 8080); // the Processing sketch

var myName = 0;
var nameInterval;

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
          baudRate: 57600,
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
      console.log('SERIAL GOT DATA:')
      console.log(data);
    });
  });
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

function serialSend(output) {
  if (myPort && myPort.options && myPort.options.open) {
    myPort.write(output+','); // add a comma for parseInt in Arduino
  }
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function sendBrightness(val){
  client.send('/rssi', Math.floor(val)); // to Processing's background brightness
  serialSend(Math.floor(val));
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function triangulateRSSI(){
  var total = 0;
  if(phone){
    total+=phone.smoothedRssi;
  }
  for(var n in speakers){
    total+=speakers[n].smoothedRssi;
  }
  var myPercentage = Math.floor((phone.smoothedRssi/total)*100);
  console.log(myPercentage);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function start(){
  setInterval(update, 100);
  noble.startScanning([], true); // start scanning with repeated UUIDs
  setupSerial();
}

function update(){

  for(var n in speakers){
    speakers[n].update();
  }
  if(phone){
    phone.update();
  }

  triangulateRSSI();

  var phoneRSSI = phone ? Math.floor(phone.smoothedRssi) : 'nada';
  bleno.startAdvertising('s_'+phoneRSSI);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

noble.on('discover', function(peripheral){
  var tag = peripheral.advertisement.localName;
  if(tag && tag.indexOf('s_')===0){
    handleSpeaker(peripheral,tag); // tag contains that speaker's internal rssi from the phone
  }
  else if(tag && tag.indexOf('Light')>=0){
    handlePhone(peripheral);
  }
});

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var phone;
var speakers = {};

function handleSpeaker(p,m){
  if(!speakers[p.uuid]){
    speakers[p.uuid] = new Device(p.uuid);
    console.log('found Speaker with UUID --> '+p.uuid);
  }
  console.log('SPEAKER');
  var internalRSSI = m.split('_')[1];
  speakers[p.uuid].receiveRSSI( p.rssi , internalRSSI );
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
  this.timeStamp = new Date().getTime();
  this.delay = 0;
  this.phoneRssi; // that node's internal rssi from the phone (broadcasted in advertisement)
}

Device.prototype.update = function(){
  // smooth the rssi on each interval
  var slide = 60;
  // global = global + ( ( new - global ) / slide );
  this.smoothedRssi = this.smoothedRssi + ( (this.rssi - this.smoothedRssi) / slide);
  if(this.smoothedRssi<0) this.smoothedRssi = 0;
  //if(this.smoothedRssi>255) this.smoothedRssi = 255;
}

Device.prototype.receiveRSSI = function(_rssi, _phoneRssi){
  this.mapRssi(_rssi); // this speaker's rssi from that node
  if(_phoneRssi && _phoneRssi!='nada') this.phoneRssi = _phoneRssi; // the node's internal rssi from the phone
  var now = new Date().getTime();
  this.delay = now-this.timeStamp;
  this.timeStamp = now;
}

Device.prototype.mapRssi = function(_rssi){
  var temp = Number(_rssi)+100; // bump rssi up to positive number
  if(temp<0) temp = 0;

  temp = Math.pow(10 , (temp/10)); // convert from dB to linear
  temp *= .02; // then scale it

  this.rssi = temp;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////