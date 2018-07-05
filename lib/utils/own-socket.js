'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OwnSocketUtils = function () {
  function OwnSocketUtils(host, port, useConn) {
    _classCallCheck(this, OwnSocketUtils);

    this.host = host;
    this.port = port;
    this.useConn = useConn;
  }

  _createClass(OwnSocketUtils, [{
    key: 'send',
    value: function send(message, callback) {
      OwnSocketUtils.send(this.host, this.port, this.useConn, message, callback);
    }
  }], [{
    key: 'readResponse',
    value: function readResponse(res) {
      if (res === OwnSocketUtils.ACK) {
        return { ack: true };
      } else if (res === OwnSocketUtils.NACK) {
        return { ack: false };
      }
      return { msg: res };
    }
  }, {
    key: 'send',
    value: function send(host, port, useConn, message, callback) {
      console.log('Establishing connection to ' + host);
      var socket = new _net2.default.Socket();
      var responses = [];

      var connAck = false;
      var connSend = false;

      // Send message after connection
      socket.connect({
        port: port,
        host: host
      }, function () {
        return _bluebird2.default.resolve().then(function () {
          if (!useConn) return true;
          return new _bluebird2.default(function (resolve, reject) {
            socket.once('data', function (buf) {
              if (buf.toString() === OwnSocketUtils.ACK) return resolve();
              return reject();
            });
          }).tap(function () {
            connAck = true;
            console.log('Connected.');
          }).then(function () {
            console.log('Send CONN');
            socket.write(OwnSocketUtils.CONN);
            return new _bluebird2.default(function (resolve, reject) {
              socket.once('data', function (buf) {
                if (buf.toString() === OwnSocketUtils.ACK) {
                  // connSend = true;
                  return resolve();
                }
                return reject();
              });
            });
          }).tap(function () {
            console.log('Authorized.');
          });
        }).then(function () {
          if ((0, _lodash.isArray)(message)) {
            message.forEach(function (messageItem) {
              console.log('write ' + messageItem);
              socket.write(messageItem);
            });
            // socket.end();
          } else {
            console.log('write single ' + message);
            socket.write(message);
            // socket.end();
          }
        });
      });

      // Send response on end
      socket.on('end', function () {
        console.log('end');
        var hasError = false;
        var returnedResponses = [];
        responses.forEach(function (response, index) {
          var res = OwnSocketUtils.readResponse(response);
          // if (index === 0 && res.ack) {
          //   console.log('ACK');
          //   return; // Ignore first ack
          // }
          if (res.ack === false) {
            console.log('NACK');
            hasError = true;
            return;
          }
          if (res.msg) {
            console.log('RES : ' + res.msg);
            returnedResponses.push(res.msg);
          }
        });

        callback(hasError ? new Error('NACK') : null, returnedResponses);
      });

      // Append data to responses (resplit if necessary)
      socket.on('data', function (buf) {
        var res = buf.toString();
        if (res === OwnSocketUtils.ACK && !connAck) {
          connAck = true;
          return;
        }
        if (res === OwnSocketUtils.ACK && !connSend) {
          connSend = true;
          return;
        }
        if (res === OwnSocketUtils.ACK && connSend && connAck) {
          socket.end();
        }
        responses = responses.concat((0, _lodash.chain)(buf.toString().split(OwnSocketUtils.MSG_SEP)).filter(function (res) {
          return res !== '';
        }).map(function (res) {
          return '' + res + OwnSocketUtils.MSG_SEP;
        }).value());
      });
    }
  }]);

  return OwnSocketUtils;
}();

OwnSocketUtils.ACK = '*#*1##';
OwnSocketUtils.NACK = '*#*0##';
OwnSocketUtils.CONN = '*99*9##';
OwnSocketUtils.MSG_SEP = '##';
exports.default = OwnSocketUtils;
module.exports = exports['default'];
//# sourceMappingURL=own-socket.js.map