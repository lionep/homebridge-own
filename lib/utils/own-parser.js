'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OwnParser = function () {
  function OwnParser() {
    _classCallCheck(this, OwnParser);
  }

  _createClass(OwnParser, null, [{
    key: 'getWhoType',
    value: function getWhoType(who) {
      var whoInt = parseInt(who, 10);
      switch (whoInt) {
        case 0:
          return 'scenario';
        case 1:
          return 'light';
        case 2:
          return 'automation';
        case 3:
          return 'load';
        case 4:
          return 'temperature';
        case 5:
          return 'burglar-alarm';
        case 7:
          return 'video-door';
        case 13:
          return 'gateway';
        case 15:
        case 25:
          return 'CEN';
        case 16:
          return 'sound-system';
        case 22:
          return 'sound-diffusion';
        case 17:
          return 'scene';
        case 18:
          return 'energy';
        default:
          return null;
      }
    }
  }, {
    key: 'getStatus',
    value: function getStatus(who, state) {
      var whoInt = parseInt(who, 10);
      var stateInt = parseInt(state, 10);
      switch (whoInt) {
        case 1:
          // light
          switch (stateInt) {
            case 0:
              return false;
            case 1:
              return true;
            default:
              return null;
          }

        case 2:
          // automation
          return stateInt;

        case 4:
          // temperature
          return stateInt / 10;

        default:
          return null;
      }
    }
  }, {
    key: 'parseCode',
    value: function parseCode(code) {
      if (typeof code !== 'string') return {};
      var reGen = /^\*([0-9]+)\*([0-2])\*([0-9]+)##$/i;
      // *#4*3*0*0284##
      var reTemp = /^\*#4\*([0-9]+)\*0\*([0-9]+)##$/i;

      if (reGen.test(code)) {
        var response = code.match(reGen);
        if (response.length < 4) return {};

        return {
          type: OwnParser.getWhoType(response[1]),
          id: parseInt(response[3], 10),
          status: OwnParser.getStatus(response[1], response[2])
        };
      } else if (reTemp.test(code)) {
        var _response = code.match(reTemp);
        if (_response.length < 3) return {};

        return {
          type: OwnParser.getWhoType('4'),
          id: parseInt(_response[1], 10),
          status: OwnParser.getStatus('4', _response[2])
        };
      }
      return {};
    }
  }]);

  return OwnParser;
}();

exports.default = OwnParser;
module.exports = exports['default'];
//# sourceMappingURL=own-parser.js.map