var ndn = require('ndn-js');
var tsToBuffer = require('./timestamp.js').tsToBuffer;

var crypto = require('crypto');
var passwd = 'bad_password';
var salt = 'bms-ucla';
var iterations = 1024;
var symkey = new Buffer(crypto.pbkdf2Sync(passwd, salt, iterations, 32));
//console.log('symkey: %s', symkey.toString('hex'));

var RSA = require('node-rsa');
var usr_key = require('./client-key.js').usr_key;
var usr_key_id = require('./client-key.js').usr_key_id;

function onData(interest, data) {
  console.log('Data received in callback.');
  console.log('Name: %s', data.getName().toUri());
  var content = data.getContent().buf();
  console.log('Raw content (hex): %s', content.toString('hex'));

  var dispatcher = data.getName().get(4).toEscapedString();
  if (dispatcher === 'data')
    {
      var iv = content.slice(0, 16);
      //console.log('iv: %s', iv.toString('hex'));
      var ciphertext = content.slice(16);
      var decipher = crypto.createDecipheriv('aes-256-cbc', symkey, iv);
      var p1 = decipher.update(ciphertext);
      var p2 = decipher.final();
      console.log('Decrypted content: %s', Buffer.concat([p1, p2]).toString());
    }
  else if (dispatcher === 'symkey')
    {
      var decrypted = usr_key.decrypt(content);
      console.log('Original symkey: %s', symkey.toString('hex'));
      console.log('Decrypted symkey: %s', decrypted.toString('hex'));
    }
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
     var ts_component = (new ndn.Name().append(ts)).get(0);
     var filter = new ndn.Exclude([ndn.Exclude.ANY, ts]);
     var template = new ndn.Interest();
     template.setChildSelector(0);
     template.setExclude(filter);
     face.expressInterest(name, template, onData, onTimeout);
   },

   function () {
     var name = new ndn.Name('/test/ucla.edu/bms/melnitz/data/studio1/electrical/J/demand');
     console.log('Request %s with exclude filter', name.toUri());
     var filter = new ndn.Exclude();
     filter.appendAny();
     var ts = tsToBuffer(new Date('Thu Jan 08 2015 18:04:07 GMT-0800 (PST)'));
     filter.appendComponent(ts);
     ts = tsToBuffer(new Date('Thu Jan 08 2015 18:04:11 GMT-0800 (PST)'));
     filter.appendComponent(ts);
     filter.appendAny();
     ts = tsToBuffer(new Date('Thu Jan 08 2015 18:04:19 GMT-0800 (PST)'));
     filter.appendComponent(ts);
     ts = tsToBuffer(new Date('Thu Jan 08 2015 18:04:23 GMT-0800 (PST)'));
     filter.appendComponent(ts);
     filter.appendAny();
     var template = new ndn.Interest();
     template.setChildSelector(1);
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

   function () {
     var name = new ndn.Name('/test/ucla.edu/bms/melnitz/symkey/studio1/electrical/AH8/voltage');
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
