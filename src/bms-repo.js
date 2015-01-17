var schema = require('./name-schema.js').schema;
var data_name_pattern = require('./name-schema.js').data_name_pattern;
var symkey_name_pattern = require('./name-schema.js').symkey_name_pattern;
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

    run();
  });

function run()
{
  var face = new ndn.Face(new ndn.UnixTransport(),
			  new ndn.UnixTransport.ConnectionInfo('/tmp/nfd.sock'));
  face.setCommandSigningInfo(keyChain, certificateName);

  var data_prefix = new ndn.Name('/ndn/ucla.edu/bms');

  function onInterest(prefix, interest, transport)
  {
    var inst_name = interest.getName();
    console.log('interest: %s', inst_name.toUri());
    var dispatcher;
    if (inst_name.size() < 5)
      dispatcher = 'data';
    else
      dispatcher = inst_name.get(4).toEscapedString();

    if (dispatcher === 'data')
      fetchData(prefix, interest, transport);
    else if (dispatcher === 'symkey')
      fetchSymkey(prefix, interest, transport);
  }

  function fetchData(prefix, interest, transport)
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
		var ts_num = parseInt(request_name.get(pos).getValueAsBuffer().toString('hex'),
				      16);
		var ts = new Date(ts_num);
		literal = connection.escape(ts);
	      }
	    where_clause += name + " = " + literal;
	  }
      }

    // Find the component where the selectors take effect
    if (request_name.size() <= data_name_pattern.length)
      {
	var selecting_component = data_name_pattern[request_name.size()];
	var order_by = ' ORDER BY ';
	var need_order_by = false;
	if (typeof selecting_component === 'number')
	  {
	    need_order_by = true;
	    var selecting_name = schema[selecting_component].name;
	    order_by += selecting_name;

	    // Order result based on child selector
	    var child_selector = interest.getChildSelector();
	    if (child_selector == null || child_selector == ndn.Interest.CHILD_SELECTOR_LEFT)
	      order_by += ' ASC';
	    else
	      order_by += ' DESC';

	    // Add exclude filter to WHERE clause
	    var filter = interest.getExclude();
	    if (filter != null)
	      {
		// Convert exclude to ranges
		var exclude_ranges = [];
		var lower = null;
		var upper = null;
		var i = 0;
		while (i < filter.size())
		  {
		    if (filter.get(i) == ndn.Exclude.ANY)
		      {
			if (i + 1 < filter.size()
			    && filter.get(i + 1) == ndn.Exclude.ANY)
			  {
			    // Skip '* *' pattern
			    i++;
			    continue;
			  }

			if (i + 2 < filter.size()
			    && filter.get(i + 1) != ndn.Exclude.ANY
			    && filter.get(i + 2) == ndn.Exclude.ANY)
			  {
			    // Skip '* X *' pattern
			    i += 2;
			    continue;
			  }

			if (i + 1 < filter.size())
			  {
			    upper = filter.get(i + 1);
			  }

			var lower_literal = null;
			var upper_literal = null;
			if (selecting_name !== 'ts')
			  {
			    if (lower != null)
			      lower_literal = connection.escape(lower.toEscapedString());
			    if (upper != null)
			      upper_literal = connection.escape(upper.toEscapedString());
			  }
			else
			  {
			    if (lower != null)
			      {
				var ts_num = parseInt(lower.getValueAsBuffer().toString('hex'),
						      16);
				var ts = new Date(ts_num);
				lower_literal = connection.escape(ts);
			      }
			    if (upper != null)
			      {
				var ts_num = parseInt(upper.getValueAsBuffer().toString('hex'),
						      16);
				var ts = new Date(ts_num);
				upper_literal = connection.escape(ts);
			      }			  
			  }

			if (lower_literal != null && upper_literal != null)
			  // [..., X, *, Y, ...]
			  exclude_ranges.push(selecting_name + ' >= ' + lower_literal
					      + ' AND ' + selecting_name + ' <= ' + upper_literal);
			else if (lower != null && upper == null)
			  // [..., X, *]
			  exclude_ranges.push(selecting_name + ' >= ' + lower_literal);
			else if (lower == null && upper != null)
			  // [*, X, ...]
			  exclude_ranges.push(selecting_name + ' <= ' + upper_literal);
			// Ignore the case like [*]

			lower = null;
			upper = null;
			i += 2;
		      }
		    else if (lower != null)
		      {
			// [..., X, Y, ...]
			exclude_ranges.push(selecting_name + ' = '
					    + connection.escape(lower.toEscapedString()));
			lower = null;
			i++;
		      }
		    else
		      {
			lower = filter.get(i);
			i++;
		      }
		  }

		//console.log(exclude_ranges);
		if (exclude_ranges.length > 0)
		  {
		    if (need_where === false)
		      need_where = true;
		    else
		      where_clause += ' AND ';

		    var exclude_where = 'NOT (';
		    for (var i = 0; i < exclude_ranges.length; i++)
		      {
			exclude_where += '(' + exclude_ranges[i] + ')';
			if (i < exclude_ranges.length - 1)
			  exclude_where += ' OR ';
		      }
		    exclude_where += ')';

		    where_clause += exclude_where;
		  }
	      }
	  }
	else
	  {
	    // If selecting a 'constant' component, just verify exclude filter
	    // and ignore child selector

	    //TODO: check exclude filter
	  }
      }

    // Assemble the query
    if (need_where)
      select_query += where_clause;

    if (need_order_by)
      select_query += order_by;

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

		       if (rows.length == 0)
			 {
			   console.log('empty result');
			   return;
			 }

		       var row = rows[0];
		       console.log(row);
		       transport.send(row['wire']);
		     });
  }

  function fetchSymkey(prefix, interest, transport)
  {
    var request_name = interest.getName();
    if (request_name.size() != symkey_name_pattern.length)
      return;

    var select_query = 'SELECT * FROM symkey';

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
		var ts_num = parseInt(request_name.get(pos).getValueAsBuffer().toString('hex'),
				      16);
		var ts = new Date(ts_num);
		literal = connection.escape(ts);
	      }
	    where_clause += name + " = " + literal;
	  }
      }

    // Assemble the query
    select_query += where_clause;

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

		       if (rows.length == 0)
			 {
			   console.log('empty result');
			   return;
			 }

		       var row = rows[0];
		       console.log(row);
		       transport.send(row['wire']);
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
}
