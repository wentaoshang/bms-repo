var RSA = require('node-rsa');

var usr_key_pem = {
 privatePem:
 "-----BEGIN RSA PRIVATE KEY-----\n" +
 "MIICXAIBAAKBgQDDNpgZFC23yGSLsMo8mzTcmdnipkUHI+i8CYagTEqHO+PnejF9\n" +
 "Ep/D+MBvEtPXHSgExsDCHP8X7B6If1df58OWXB9GPnXUsAsjKKXgOaKoMJr9NZXP\n" +
 "qlBbJSrT0h5590hCm2ePPUVkvJKsOX6gCFnptbLzF7pvb3zKDc+zXjyHPwIDAQAB\n" +
 "AoGBALR4BTayI+3SkblekChlaAJFLVxOUGRgeylTOSV6QjAxWulFWvkAvbijf+tv\n" +
 "oW4uIy//OnZ57g6EmFmiN/mOvo3meBvWijHxUJG1suKrEgG8Gm0LZn0CyycTtutl\n" +
 "ziSDJ3F4whEZfuqciAFOTTgAXPRHMa/cZbSDo4aGR5mbqE0ZAkEA3+HmB/1SgwMB\n" +
 "bopCmkh+sslFhtD2xUxlXnlC3ur4rOmjtH7YE0Q2UDsJFj9eg/BA4fQ/orh9usGv\n" +
 "AVph7o6lswJBAN830Xc7cjxeF3vQyJk1vqqPf15FGvkraq7gHb5MPAtofh78PtzD\n" +
 "+hyblvWAYBstR/K6up1KG+LP6RXA43q7qkUCQA49540wjzQoV8n5X51C6VRkO1kF\n" +
 "J/2LC5PD8P4PQnx1bGWKACLRnwbhioVwyIlqGiaFjBrE07KyqXhTkJFFX8MCQAjW\n" +
 "qfmhpfVT+HQToU3HvgP86Jsv+1Bwcqn3/9WAKUR+X7gUXtzY+bdWRdT0v1l0Iowu\n" +
 "7qK5w37oop8U4y0B700CQBKRizBt1Nc02UMDzdamQsgnRjuIjlfmryfZpemyx238\n" +
 "Q0s2+cKlqbfDOUY/CAj/z1M6RaISQ0TawCX9NIGa9GI=\n" +
 "-----END RSA PRIVATE KEY-----",
 publicPem:
 "-----BEGIN PUBLIC KEY-----\n" +
 "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDNpgZFC23yGSLsMo8mzTcmdni\n" +
 "pkUHI+i8CYagTEqHO+PnejF9Ep/D+MBvEtPXHSgExsDCHP8X7B6If1df58OWXB9G\n" +
 "PnXUsAsjKKXgOaKoMJr9NZXPqlBbJSrT0h5590hCm2ePPUVkvJKsOX6gCFnptbLz\n" +
 "F7pvb3zKDc+zXjyHPwIDAQAB\n" +
 "-----END PUBLIC KEY-----"
};

var usr_key = new RSA(usr_key_pem.privatePem, {encryptionScheme: 'pkcs1'});

function getKeyID (key) {
  var der = key.exportKey('pkcs8-public-der');
  var hash = require("crypto").createHash('sha256');
  hash.update(der);
  return new Buffer(hash.digest());
}

var usr_key_id = getKeyID(usr_key);

exports.usr_key = usr_key;
exports.usr_key_id = usr_key_id;