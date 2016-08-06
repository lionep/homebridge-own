'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SocketUtils = function () {
  function SocketUtils(host, port) {
    _classCallCheck(this, SocketUtils);

    this.host = host;
    this.port = port;
  }

  _createClass(SocketUtils, [{
    key: 'send',
    value: function send(message, callback) {
      SocketUtils.send(this.host, this.port, message, callback);
    }
  }], [{
    key: 'readResponse',
    value: function readResponse(res) {
      if (res === SocketUtils.ACK) {
        return { ack: true };
      } else if (res === SocketUtils.NACK) {
        return { ack: false };
      }
      return { msg: res };
    }
  }, {
    key: 'send',
    value: function send(host, port, message, callback) {
      var socket = new _net2.default.Socket();
      var responses = [];

      // Send message after connection
      socket.connect({
        port: port,
        host: host
      }, function () {
        socket.end(message);
      });

      // Send response on end
      socket.on('end', function () {
        var hasError = false;
        var returnedResponses = [];
        responses.forEach(function (response, index) {
          var res = SocketUtils.readResponse(response);
          if (index === 0 && res.ack) return; // Ignore first ack
          if (res.nack) {
            hasError = true;
            return;
          }
          if (res.msg) {
            returnedResponses.push(res.msg);
          }
        });

        callback(hasError ? new Error('NACK') : null, returnedResponses);
      });

      // Append data to responses (resplit if necessary)
      socket.on('data', function (buf) {
        responses = responses.concat((0, _lodash.chain)(buf.toString().split(SocketUtils.MSG_SEP)).filter(function (res) {
          return res !== '';
        }).map(function (res) {
          return '' + res + SocketUtils.MSG_SEP;
        }).value());
      });
    }
  }]);

  return SocketUtils;
}();

SocketUtils.ACK = '*#*1##';
SocketUtils.NACK = '*#*0##';
SocketUtils.MSG_SEP = '##';
exports.default = SocketUtils;
module.exports = exports['default'];
//# sourceMappingURL=socket.js.map