var schema = require('./name-schema.js').schema;
var data_points = require('./name-schema.js').data_points;
var tsToBuffer = require('./timestamp.js').tsToBuffer;

var crypto = require('crypto');

var ndn = require('ndn-js');
var keyChain = require('./fake-keychain.js').keyChain;
var certificateName = require('./fake-keychain.js').certificateName;

var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'test',
  password : 'test',
  database : 'bms'
  });

connection.connect(function(err) {
    if (err)
      {
	console.error('error connecting: ' + err.stack);
	return;
      }

    console.log('connected to mysql as id ' + connection.threadId);

    run();
  });

function run()
{
  var passwd = 'bad_password';
  var salt = 'bms-ucla';
  var iterations = 1024;
  var usr_key = new Buffer(crypto.pbkdf2Sync(passwd, salt, iterations, 32));

  function updateSymKey(name, ts, val)
  {
    var iv = new Buffer(crypto.randomBytes(16)); // use async version?
    var data_name = new ndn.Name(name);
    data_name.components[4] = new ndn.Name.Component('symkey');
    data_name.append(tsToBuffer(ts));
    var data = new ndn.Data(data_name);
    var cipher = crypto.createCipheriv('aes-256-cbc', usr_key, iv);
    var p1 = cipher.update(val);
    var p2 = cipher.final();
    data.setContent(Buffer.concat([iv, p1, p2]));
    //data.getMetaInfo().setFreshnessPeriod(4000);
    keyChain.sign(data, certificateName);
    var wire = data.wireEncode().buf();

    var insert_query = 'INSERT INTO symkey VALUES(';

    for (var i = 0; i < schema.length - 3; i++)
      {
	var pos = schema[i].pos;
	insert_query += connection.escape(name.get(pos).toEscapedString()) + ", ";
      }
    insert_query += connection.escape(ts) + ", " + connection.escape(val) + ", "
      + connection.escape(wire) + ')';

    connection.query(insert_query,
		     function(err, rows, fields) {
		       if (err)
			 {
			   console.error('insert error');
			   return;
			 }
		     });
  }

  var key_update_interval = 10000; // ms

  var data_fetch_interval = 2000; // ms

  data_points.forEach(function(element) {
      var name = new ndn.Name(element.name);
      var symkey_ts = new Date();
      symkey_ts = new Date(symkey_ts - symkey_ts.getMilliseconds()); // round to seconds
      var symkey_ts_buffer = tsToBuffer(symkey_ts);
      var symkey = new Buffer(crypto.randomBytes(32)); // use async version?
      updateSymKey(name, symkey_ts, symkey); // wait until finish?

      // Schedule symkey update
      setInterval(function() {
	  symkey_ts = new Date();
	  symkey_ts = new Date(symkey_ts - symkey_ts.getMilliseconds()); // round to seconds	  
	  updateSymKey(name, symkey_ts, symkey);
	  symkey_ts = new Date(symkey_ts + key_update_interval); // for test only
	}, key_update_interval);

      // Schedule data generation
      setInterval(function() {
	  var ts = new Date();
	  ts = new Date(ts - ts.getMilliseconds()); // round to seconds
	  var val = Math.sin(ts % 10E6 / 10E5) * 5;

	  // Encrypt and create Data packet
	  var iv = new Buffer(crypto.randomBytes(16)); // use async version?
	  var data_name = new ndn.Name(name);
	  data_name.append(tsToBuffer(ts));
	  var data = new ndn.Data(data_name);
	  var content = JSON.stringify({ts: ts.getTime(), val: val});
	  var cipher = crypto.createCipheriv('aes-256-cbc', symkey, iv);
	  var p1 = cipher.update(content, 'utf8');
	  var p2 = cipher.final();
	  data.setContent(Buffer.concat([symkey_ts_buffer, iv, p1, p2]));
	  //data.getMetaInfo().setFreshnessPeriod(4000);
	  keyChain.sign(data, certificateName);
	  var wire = data.wireEncode().buf();

	  var insert_query = 'INSERT INTO data VALUES(';

	  for (var i = 0; i < schema.length - 3; i++)
	    {
	      var pos = schema[i].pos;
	      insert_query += connection.escape(name.get(pos).toEscapedString()) + ", ";
	    }
	  insert_query += connection.escape(ts) + ", " + connection.escape(val) + ", "
	    + connection.escape(wire) + ')';

	  connection.query(insert_query,
			   function(err, rows, fields) {
			     if (err)
			       {
				 console.error('insert error');
				 return;
			       }
			   });
	}, data_fetch_interval);
    });

  //connection.end();
}