var ndn = require('ndn-js');

var onData = function(interest, data) {
  console.log("Data received in callback.");
  console.log('Name: ' + data.getName().toUri());
  console.log('Content: ' + data.getContent().buf().toString());
  face.close();
};

var onTimeout = function(interest) {
  console.log("Interest time out.");
  console.log('Interest name: ' + interest.getName().toUri());
  face.close();
};

var face = new ndn.Face(new ndn.UnixTransport(),
			new ndn.UnixTransport.ConnectionInfo('/tmp/nfd.sock'));
var name = new ndn.Name("/test/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage");
console.log("Express name " + name.toUri());
face.expressInterest(name, onData, onTimeout);

name = new ndn.Name("/test/ucla.edu/bms/melnitz/data/studio1/electrical");
console.log("Express name " + name.toUri());
face.expressInterest(name, onData, onTimeout);

name = new ndn.Name("/test/ucla.edu/bms/melnitz");
console.log("Express name " + name.toUri());
face.expressInterest(name, onData, onTimeout);
