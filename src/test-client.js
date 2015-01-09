var ndn = require('ndn-js');
var tsToBuffer = require('./timestamp.js').tsToBuffer;

function onData(interest, data) {
  console.log('Data received in callback.');
  console.log('Name: %s', data.getName().toUri());
  console.log('Content: %s', data.getContent().buf().toString());
  test_cases.runNextCase();
};

function onTimeout(interest) {
  console.log('Interest time out.');
  console.log('Interest name: %s', interest.getName().toUri());
  test_cases.runNextCase();
};

var face = new ndn.Face(new ndn.UnixTransport(),
			new ndn.UnixTransport.ConnectionInfo('/tmp/nfd.sock'));

var test_cases = {
 index: 0,
 cases:
 [function () {
      var name = new ndn.Name('/test/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage');
      name.append(tsToBuffer(new Date('Thu Jan 08 2015 18:04:07 GMT-0800 (PST)')));
      console.log('Request %s', name.toUri());
      face.expressInterest(name, onData, onTimeout);
    },

   function () {
     var name = new ndn.Name('/test/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage');
     console.log('Request %s', name.toUri());
     face.expressInterest(name, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/test/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage');
     console.log('Request %s with child selector', name.toUri());
     var template = new ndn.Interest();
     template.setChildSelector(1);
     face.expressInterest(name, template, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/test/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage');
     console.log('Request %s with exclude filter', name.toUri());
     var ts = tsToBuffer(new Date('Thu Jan 08 2015 18:04:13 GMT-0800 (PST)'));
     var ts_component = new ndn.Name().append(ts);
     var filter = new ndn.Exclude([ndn.Exclude.ANY, ts]);
     var template = new ndn.Interest();
     template.setChildSelector(0);
     template.setExclude(filter);
     face.expressInterest(name, template, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/test/ucla.edu/bms/melnitz/data/studio1/electrical');
     console.log('Request %s', name.toUri());
     face.expressInterest(name, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/test/ucla.edu/bms/melnitz');
     console.log('Request %s', name.toUri());
     face.expressInterest(name, onData, onTimeout);
   },
   ],

 runNextCase: function () {
    this.index++;
    this.run();
  },

 run: function () {
    if (this.index >= this.cases.length)
      {
	face.close();
	return;
      }
    this.cases[this.index]();
  }
};

test_cases.run();
