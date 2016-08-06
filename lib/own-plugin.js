'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ownPlatform = require('./own-platform');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OwnPlugin = function () {
  function OwnPlugin() {
    _classCallCheck(this, OwnPlugin);
  }

  _createClass(OwnPlugin, null, [{
    key: 'initializer',
    value: function initializer(homebridge) {
      homebridge.registerPlatform('homebridge-own', 'own', _ownPlatform.OwnPlatformFactory.getPlatform(homebridge.hap.Accessory, homebridge.hap.Characteristic, homebridge.hap.uuid, homebridge.hap.Service));
    }
  }]);

  return OwnPlugin;
}();

exports.default = OwnPlugin.initializer;
module.exports = exports['default'];
//# sourceMappingURL=own-plugin.js.map