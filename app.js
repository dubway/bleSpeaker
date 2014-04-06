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
  client.send('/rssi', val); // to Processing's background brightness
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var delay = 100;
var blue_timeStamp;

function start(){
  blue_timeStamp = new Date().getTime();
  setInterval(update,delay);
  noble.startScanning([], true); // start scanning with repeated UUIDs
}

function update(){

  if(phone){
    phone.update();
    sendBrightness(Math.floor(phone.distance)); // send to Processing over OSC
  }
  for(var n in speakers){
    speakers[n].update();
  }

  var tempRSSI = phone ? Math.floor(phone.distance) : 'nada';
  bleno.startAdvertising('s_'+tempRSSI);
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
  var internalRSSI = m.split('_')[1];
  speakers[p.uuid].receiveRSSI( p.rssi , internalRSSI );
  console.log('distance: '+speakers[p.uuid].distance+' -- phoneDistance: '+speakers[p.uuid].phoneRssi + ' -- delay: '+speakers[p.uuid].delay);
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
  this.distance = 0; // scaled and smoothed rssi from node (eventually volume)
  this.timeStamp = new Date().getTime();
  this.delay = 0;
  this.phoneRssi; // that node's internal rssi from the phone (broadcasted in advertisement)
}

Device.prototype.update = function(){
  // smooth the rssi on each interval
  var slide = 60;
  // global = global + ( ( new - global ) / slide );
  this.distance = this.distance + ( (this.rssi - this.distance) / slide);
  if(this.distance<0) this.distance = 0;
  if(this.distance>255) this.distance = 255;
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