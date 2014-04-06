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

var max = -40;
var min = -70;
var diff = max-min;

function mapRSSI(rssi){
  console.log(rssi);
  rssi = Number(rssi);
  rssi -= min;
  rssi /= diff;
  rssi = Math.floor(rssi*255);
  if(rssi<0) rssi=0;
  else if(rssi>255) rssi = 255;
  sendBrightness(rssi);
}

function sendBrightness(val){
  //console.log(' ------ >>>>>  sending brightness: '+val);
  client.send('/rssi', val);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var delay = 100;
var andy_timeStamp;
var blue_timeStamp;

function start(){
  andy_timeStamp = new Date().getTime();
  blue_timeStamp = new Date().getTime();
  setInterval(startInterval,delay);
  noble.startScanning([], true); // start scanning
}

noble.on('discover', function(peripheral){
  console.log('discovered');
  if(peripheral.advertisement.localName && peripheral.advertisement.localName.indexOf('Andy')>=0){
    var now = new Date().getTime();
    var delay = now-andy_timeStamp;
    //console.log('discovered --> '+peripheral.advertisement.localName + ' @ '+peripheral.rssi+'_rssi & '+delay+'_delay');
    andy_timeStamp = now;
  }
  else if(peripheral.advertisement.localName && peripheral.advertisement.localName.indexOf('Light')>=0){
    var now = new Date().getTime();
    var delay = now-blue_timeStamp;
    //console.log('discovered --> '+peripheral.advertisement.localName + ' @ '+peripheral.rssi+'_rssi & '+delay+'_delay');
    blue_timeStamp = now;
    mapRSSI(peripheral.rssi);
  }
});

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function startInterval(){
  myName++;
  bleno.startAdvertising('Andy_'+myName);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////