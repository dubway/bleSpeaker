var bleno = require('bleno');

var PrimaryService = bleno.PrimaryService;
var Characteristic = bleno.Characteristic;
var Descriptor = bleno.Descriptor;

var SERVICE_UUID = '4e59554954502d4a696879756e4c6565';

console.log('\n\nWelcome to GGIT!\n\n');

// characteristics
// ------------------
// goalState
// lockState
// dailySteps
// often

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('itp', [SERVICE_UUID]);
  } else {
    bleno.stopAdvertising();
  }
});

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
  if (error) return;
  updateStuff();
  //setInterval(updateStuff,500);  
});

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function() {
  //console.log('on -> servicesSet');
});

bleno.on('disconnect', function() {
  console.log('on -> disconnect');
});

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

var isAdvertising = false;
var currentVolume = 0;

function updateStuff(){

  currentVolume++;

  var setGoal = function(goal) {
    return new Characteristic({
      uuid:'4954',
      properties: ['read','write'],
      onWriteRequest: function(callback){
        console.log('write');
        callback(Characteristic.RESULT_SUCCESS);
      },
      onReadRequest: function(offset,callback){
        console.log('read');
        callback(this.RESULT_SUCCESS, numToBuf(currentVolume) )
      }
    });
  }

  var volume_service = new PrimaryService({
    uuid: '474f',
    characteristics: [setGoal(currentVolume+'')]
  });

  bleno.setServices([volume_service]);

  console.log(currentVolume);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

function numToBuf(num){
  return new Buffer(num+'','utf8');
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////






