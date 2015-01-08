var schema = require('./name-schema.js').schema;
var data_name_pattern = require('./name-schema.js').data_name_pattern;
var data_points = require('./name-schema.js').data_points;

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

	  where_clause += name + "='" + request_name.get(pos).toEscapedString() + "'";
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

//   if (request_name.size() > schema[0].pos)
//     {
//       var where_clause = ' WHERE ';
//       for (var i = 0; i < schema.length; i++)
// 	{
// 	  var name = schema[i].name;
// 	  var pos = schema[i].pos;
// 	  if (pos >= request_name.size())
// 	    break;

// 	  if (i != 0)
// 	    where_clause += ' AND ';

// 	  where_clause += name + "='" + request_name.get(pos).toEscapedString() + "'";
// 	}
//       select_query += where_clause;
//     }

//   // Order result based on child selector
//   var child_selector = interest.getChildSelector();
//   if (child_selector == null || child_selector == ndn.Interest.CHILD_SELECTOR_LEFT)
//     select_query += ' ORDER BY ts ASC';
//   else
//     select_query += ' ORDER BY ts DESC';

  // Limit returned result to be top 1
  select_query += ' LIMIT 1';

  console.log('query:', select_query);

  connection.query(select_query,
		   function(err, rows, fields) {
		     if (err)
		       {
			 console.error('select error');
			 return;
		       }
		     console.log(rows);
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
