var util = require('util');

var bleno = require('bleno');
var noble = require('noble');

bleno.on('stateChange', function(state) {
  noble.stopScanning();
  bleno.stopAdvertising();

  console.log('turned off');
});