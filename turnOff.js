var util = require('util');

var bleno = require('bleno');
var noble = require('noble');

bleno.on('stateChange', function(state) {
  bleno.stopAdvertising([],true);

  console.log('bleno turned off');
});


noble.on('stateChange', function(state) {
  noble.stopScanning();

  console.log('noble turned off');
});