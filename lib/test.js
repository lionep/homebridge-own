'use strict';

var _ownSocket = require('./utils/own-socket');

var _ownSocket2 = _interopRequireDefault(_ownSocket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Status
var start = Date.now();
_ownSocket2.default.send('10.0.0.23', 20000, '*#1*11##', function (err, res) {
  if (err) console.error(err);
  console.log(res);
  console.log(Date.now() - start + 'ms');
});
_ownSocket2.default.send('10.0.0.23', 20000, '*#1*12##', function (err, res) {
  if (err) console.error(err);
  console.log(res);
  console.log(Date.now() - start + 'ms');
});
_ownSocket2.default.send('10.0.0.23', 20000, '*#1*15##', function (err, res) {
  if (err) console.error(err);
  console.log(res);
  console.log(Date.now() - start + 'ms');
});
_ownSocket2.default.send('10.0.0.23', 20000, '*#1*16##', function (err, res) {
  if (err) console.error(err);
  console.log(res);
  console.log(Date.now() - start + 'ms');
});
_ownSocket2.default.send('10.0.0.23', 20000, '*#1*17##', function (err, res) {
  if (err) console.error(err);
  console.log(res);
  console.log(Date.now() - start + 'ms');
});
//# sourceMappingURL=test.js.map