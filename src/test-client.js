var ndn = require('ndn-js');
var tsToBuffer = require('./timestamp.js').tsToBuffer;

var crypto = require('crypto');
var passwd = 'bad_password';
var salt = 'bms-ucla';
var iterations = 1024;
var usr_key = new Buffer(crypto.pbkdf2Sync(passwd, salt, iterations, 32));

function onData(interest, data) {
  console.log('Data received in callback.');
  var data_name = data.getName();
  console.log('Name: %s', data_name.toUri());
  var content = data.getContent().buf();
  console.log('Raw content (hex): %s', content.toString('hex'));

  if (initial_ts == null)
    {
      var ts_num = parseInt(data_name.get(-1).getValueAsBuffer().toString('hex'), 16);
      initial_ts = new Date(ts_num);
      console.log('initial_ts, %s', initial_ts);
    }

  var symkey_ts = content.slice(0, 8);  // timestamp length = 8
  var data_iv = content.slice(8, 24);  // iv length = 16
  var raw_data = content.slice(24);  // the rest is encrypted data 

  var onSymKey = function (key_inst, key_data) {
    var key_content = key_data.getContent().buf();
    var key_iv = key_content.slice(0, 16);
    var ciphertext = key_content.slice(16);
    var decipher = crypto.createDecipheriv('aes-256-cbc', usr_key, key_iv);
    var p1 = decipher.update(ciphertext);
    var p2 = decipher.final();
    var symkey = Buffer.concat([p1, p2]);
    console.log('Symkey: %s', symkey.toString('hex'));

    decipher = crypto.createDecipheriv('aes-256-cbc', symkey, data_iv);
    p1 = decipher.update(raw_data);
    p2 = decipher.final();
    var msg = Buffer.concat([p1, p2]);
    console.log('Decrypted data: %s', msg.toString());

    test_cases.runNextCase();
  };

  var symkey_name = new ndn.Name(data_name);
  symkey_name.components[4] = new ndn.Name.Component('symkey');
  symkey_name.components[9] = new ndn.Name.Component(symkey_ts);
  face.expressInterest(symkey_name, onSymKey, onTimeout);
};

function onTimeout(interest) {
  console.log('Interest time out.');
  console.log('Interest name: %s', interest.getName().toUri());
  test_cases.runNextCase();
};

var face = new ndn.Face(new ndn.UnixTransport(),
			new ndn.UnixTransport.ConnectionInfo('/tmp/nfd.sock'));

var initial_ts = null;

var test_cases = {
 index: 0,
 cases:
 [
  function () {
      var name = new ndn.Name('/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage');
      console.log('Request %s', name.toUri());
      face.expressInterest(name, onData, onTimeout);
    },

   function () {
     var name = new ndn.Name('/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage');
     name.append(tsToBuffer(new Date(initial_ts + 2000)));
     console.log('Request %s', name.toUri());
     face.expressInterest(name, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage');
     console.log('Request %s with child selector', name.toUri());
     var template = new ndn.Interest();
     template.setChildSelector(1);
     face.expressInterest(name, template, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage');
     console.log('Request %s with exclude filter', name.toUri());
     var ts = tsToBuffer(new Date(initial_ts + 2000));
     var ts_component = (new ndn.Name().append(ts)).get(0);
     var filter = new ndn.Exclude([ndn.Exclude.ANY, ts]);
     var template = new ndn.Interest();
     template.setChildSelector(0);
     template.setExclude(filter);
     face.expressInterest(name, template, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/J/demand');
     console.log('Request %s with exclude filter', name.toUri());
     var filter = new ndn.Exclude();
     filter.appendAny();
     var ts = tsToBuffer(new Date(initial_ts));
     filter.appendComponent(ts);
     ts = tsToBuffer(new Date(initial_ts.getTime() + 2000));
     filter.appendComponent(ts);
     filter.appendAny();
     ts = tsToBuffer(new Date(initial_ts.getTime() + 6000));
     filter.appendComponent(ts);
     ts = tsToBuffer(new Date(initial_ts.getTime() + 10000));
     filter.appendComponent(ts);
     filter.appendAny();
     var template = new ndn.Interest();
     template.setChildSelector(1);
     template.setExclude(filter);
     face.expressInterest(name, template, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/ndn/ucla.edu/bms/melnitz/data/studio1/electrical');
     console.log('Request %s', name.toUri());
     face.expressInterest(name, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/ndn/ucla.edu/bms/melnitz');
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
