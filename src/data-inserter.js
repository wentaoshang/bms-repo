var schema = require('./name-schema.js').schema;
var data_points = require('./name-schema.js').data_points;

var ndn = require('ndn-js');
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
  });

var num_of_samples = 10;

data_points.forEach(function(element) {
    var name = new ndn.Name(element.name);
    var start_ts = new Date('Thu Jan 08 2015 18:04:07 GMT-0800 (PST)');

    for (var d = 0; d < num_of_samples; d++)
      {
	var ts = start_ts + d * 2000;
	var val = Math.random() * 10;
	var insert_query = 'INSERT INTO data VALUES(';

	for (var i = 0; i < schema.length - 2; i++)
	  {
	    var pos = schema[i].pos;
	    insert_query += "'" + name.get(pos).toEscapedString() + "',";
	  }
	insert_query += "'" + (new Date(ts).toISOString()) + "','" + val + "')";

	connection.query(insert_query,
			 function(err, rows, fields) {
			   if (err)
			     {
			       console.error('insert error');
			       return;
			     }
			 });
      }
  });

connection.query('SELECT * FROM data',
		 function(err, rows, fields) {
		   if (err)
		     {
		       console.error('select error');
		       return;
		     }
		   //console.log(rows);
		   //console.log(fields);
		 });

connection.end();