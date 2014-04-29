var serialport = require("serialport");
var SerialPort  = serialport.SerialPort;

serialport.list(function (error, ports) {
  if(!error){
    ports.forEach(function(port) {
      console.log(port);
    });
  }
});