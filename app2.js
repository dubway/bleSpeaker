//////////////////////////////
//////////////////////////////
//////////////////////////////

var bleno = require('bleno');

//////////////////////////////
//////////////////////////////
//////////////////////////////

var primaryService = new bleno.PrimaryService({
    uuid: '01010101010101010101010101010101',
    characteristics: [
        new bleno.Characteristic({
        uuid: '01010101010101010166616465524742',
        properties: ['write', 'writeWithoutResponse', 'notify'], // can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify'
        descriptors: [
            new bleno.Descriptor({
            uuid: '2901',
            value: 'value thing'
          })
        ]
    })]
});

//////////////////////////////
//////////////////////////////
//////////////////////////////

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('herro', [primaryService.uuid]);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
  
  if (!error) {
    bleno.setServices([primaryService]);
  }
});

//////////////////////////////
//////////////////////////////
//////////////////////////////