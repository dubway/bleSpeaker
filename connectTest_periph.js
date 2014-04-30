////////////////////////////////
////////////////////////////////
////////////////////////////////

var util = require('util');

var bleno = require('bleno');
var noble = require('noble');

////////////////////////////////
////////////////////////////////
////////////////////////////////

noble.on('stateChange', function(state) {
  console.log('Noble: ' + state);

  if(state==='poweredOn'){
  	noble.startScanning([], true);
  }
});

bleno.on('stateChange', function(state) {
  console.log('Bleno: ' + state);
	if(state==='poweredOn'){
  	bleno.startAdvertising('Speaker',['fffffffffffffffffffffffffffffff0'], function(error){
  		console.log('error on startAdvertising');
  	});
  }
});

////////////////////////////////
////////////////////////////////
////////////////////////////////

var counter = 0;

noble.on('discover',function(periph){
	if(periph.advertisement.localName==='LightBlue'){
		console.log('LightBlue - '+(counter++));
	}
	else if(periph.advertisement.localName==='Speaker'){
		console.log('Speaker - '+(counter++));
	}
});

////////////////////////////////
////////////////////////////////
////////////////////////////////