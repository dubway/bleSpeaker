var osc = require('node-osc');
var OSC_client = new osc.Client('127.0.0.1', 8081);
var OSC_server = new osc.Server(8080, '0.0.0.0');
OSC_server.on('message',function(msg,rinfo){
  console.log('got an OSC message');
  console.log(msg);
});

setInterval(function(){
	OSC_client.send('/test', 100, 20);
},300);