////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var util = require('util');

var bleno = require('bleno');
var noble = require('noble');

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

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function sendBrightness(val){
  client.send('/rssi', val);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var delay = 100;
var blue_timeStamp;

function start(){
  blue_timeStamp = new Date().getTime();
  setInterval(update,delay);
  noble.startScanning([], true); // start scanning
}

function update(){

  if(phone){
    phone.update();
    console.log(phone.distance);
    sendBrightness(Math.floor(phone.distance)); // send to Processing over OSC
  }
  for(var n in speakers){
    speakers[n].update();
  }

  var tempRSSI = phone ? phone.rssi : 'nada';
  bleno.startAdvertising('s_'+tempRSSI);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

noble.on('discover', function(peripheral){
  var tag = peripheral.advertisement.localName;
  if(tag && tag.indexOf('s_')===0){
    handleSpeaker(peripheral,tag);
  }
  else if(tag && tag.indexOf('Light')>=0){
    handPhone(peripheral);
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
  speakers[p.uuid].receiveRSSI( p.rssi , m.split('_')[1] );
}

function handPhone(p){
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
  this.rssi;
  this.distance = 0;
  this.timeStamp;
  this.phoneRssi;
}

Device.prototype.update = function(){
  // global = global + ( ( new - global ) / slide );
  var slide = 10;
  this.distance = this.distance + ( (this.rssi - this.distance) / slide);
  if(this.distance<0) this.distance = 0;
  if(this.distance>255) this.distance = 255;
}

Device.prototype.receiveRSSI = function(_rssi, _phoneRssi){
  this.mapRssi(_rssi);
  if(_phoneRssi!='nada') this.phoneRssi = _phoneRssi;
  this.timeStamp = new Date().getTime();
}

Device.prototype.mapRssi = function(_rssi){

  var temp = Number(_rssi);

  temp = Math.pow(10 , (temp/10)) * 1000000;

  this.rssi = temp;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////