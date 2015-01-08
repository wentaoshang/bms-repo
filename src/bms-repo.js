var schema = require('./name-schema.js').schema;
var data_name_pattern = require('./name-schema.js').data_name_pattern;
var data_points = require('./name-schema.js').data_points;
var tsToBuffer = require('./timestamp.js').tsToBuffer;

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

console.log('connect to mysql');
connection.connect(function(err) {
    if (err)
      {
	console.error('error connecting: ' + err.stack);
	return;
      }

    console.log('connected to mysql as id ' + connection.threadId);
  });

var face = new ndn.Face(new ndn.UnixTransport(),
			new ndn.UnixTransport.ConnectionInfo('/tmp/nfd.sock'));
face.setCommandSigningInfo(keyChain, certificateName);

var data_prefix = new ndn.Name('/test/ucla.edu/bms');

function onInterest(prefix, interest, transport)
{
  var request_name = interest.getName();
  var select_query = 'SELECT * FROM data';

  // Parse name to extract filter
  var where_clause = ' WHERE ';
  var need_where = false;
  for (var i = 0; i < request_name.size(); i++)
    {
      var column = data_name_pattern[i];
      if (typeof column === 'number')
	{
	  var name = schema[column].name;
	  var pos = schema[column].pos; // pos must equal to i

	  if (need_where === false)
	    need_where = true;
	  else
	    where_clause += ' AND ';

	  var literal; 
	  if (name !== 'ts')
	    literal = connection.escape(request_name.get(pos).toEscapedString());
	  else
	    {
	      var ts_num = parseInt(request_name.get(pos).getValueAsBuffer().toString('hex'), 16);
	      var ts = new Date(ts_num);
	      literal = connection.escape(ts);
	    }
	  where_clause += name + " = " + literal;
	}
    }

  if (need_where)
    select_query += where_clause;

  // Find the component where the selectors take effect
  var selecting_component = data_name_pattern[request_name.size()];
  if (typeof selecting_component === 'number')
    {
      var order_by = ' ORDER BY ' + schema[selecting_component].name;

      // Order result based on child selector
      var child_selector = interest.getChildSelector();
      if (child_selector == null || child_selector == ndn.Interest.CHILD_SELECTOR_LEFT)
	order_by += ' ASC';
      else
	order_by += ' DESC';

      select_query += order_by;

      //TODO: translate exclude filter
    }
  else
    {
      // If selecting a 'constant' component, just verify exclude filter
      // Ignore child selector

      //TODO: check exclude filter
    }

  // Limit returned result to be top 1
  select_query += ' LIMIT 1';

  console.log('query: %s', select_query);

  connection.query(select_query,
		   function(err, rows, fields) {
		     if (err)
		       {
			 console.error('select error');
			 return;
		       }

		     //console.log(rows);
		     var row = rows[0];
		     var data_name = new ndn.Name('/');
		     data_name_pattern.forEach(function(item) {
			 if (typeof item !== 'number')
			   data_name.append(item);
			 else
			   {
			     var name = schema[item].name;
			     if (name !== 'ts')
			       data_name.append(row[name]);
			     else
			       data_name.append(tsToBuffer(row[name]));
			   }
		       });
		     console.log('name: %s', data_name.toUri());

		     var data = new ndn.Data(data_name);
		     var content = JSON.stringify({ts: row['ts'].getTime(), val: row['val']});
		     data.setContent(content);
		     //data.getMetaInfo().setFreshnessPeriod(4000);
		     keyChain.sign(data, certificateName);
		     var wire = data.wireEncode();
		     transport.send(wire.buf());
		   });
}

function onRegisterFailed(prefix)
{
  console.log('register failed for prefix', prefix.toUri());
  face.close();
  connection.end();
}

console.log('register prefix', data_prefix.toUri());
face.registerPrefix(data_prefix, onInterest, onRegisterFailed);
