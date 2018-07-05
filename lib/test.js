'use strict';

var _ownSocket = require('./utils/own-socket');

var _ownSocket2 = _interopRequireDefault(_ownSocket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ip = '192.168.1.250';
// const ip = '10.0.0.178';

// Status
var start = Date.now();
_ownSocket2.default.send(ip, 20000, true, '*#1*0##', function (err, res) {
  if (err) console.error(err);
  console.log(res);
  console.log(Date.now() - start + 'ms');
});

/*
OwnSocketUtils.send(ip, 20000, '*#1*12##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send(ip, 20000, '*#1*15##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send(ip, 20000, '*#1*16##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send(ip, 20000, '*#1*17##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
*/
//# sourceMappingURL=test.js.map