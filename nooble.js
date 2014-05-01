var noble = require('noble');

console.log('noble');

noble.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    noble.startScanning([],true);
  } else {
    noble.stopScanning();
  }
});

noble.on('scanStart', function() {
  console.log('on -> scanStart');
});

noble.on('scanStop', function() {
  console.log('on -> scanStop');
});

var gotIt = false;

noble.on('discover', function(peripheral) {

  console.log('on -> discover: ' + peripheral.advertisement.localName);

  if(peripheral.advertisement.localName=='LightBlue' && !gotIt){

    gotIt = true;

    console.log('TRYING TO CONNECT');
  
    peripheral.on('connect', function() {
      console.log('on -> CONNECTED');

      this.discoverServices();
    });

    peripheral.on('servicesDiscover', function(services) {
      console.log('on -> peripheral services discovered ' + services);

      // if(services[0]){

      //   services[0].on('characteristicsDiscover', function(characteristics) {
      //     console.log('on -> service characteristics discovered ' + characteristics);
      //   }

      //   services[0].discoverIncludedServices();
      // }
    });

    peripheral.connect();
  
  }
});

