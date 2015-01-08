exports.tsToBuffer = function (value) {
  if (value <= 0)
    return new Buffer([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);

  // Encode into 64 bits.
  var size = 8;
  var result = new Buffer(size);
  var i = 0;
  while (i < 8)
    {
      ++i;
      result[size - i] = value % 256;
      value = Math.floor(value / 256);
    }
  return result;
}
