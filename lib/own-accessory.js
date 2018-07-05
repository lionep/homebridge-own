'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OwnAccessoryFactory = exports.TempSensorOwnAccessory = exports.AutomationOwnAccessory = exports.LightOwnAccessory = exports.OwnAccessory = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _hapNodejs = require('hap-nodejs');

var _ownSocket = require('./utils/own-socket');

var _ownSocket2 = _interopRequireDefault(_ownSocket);

var _ownParser = require('./utils/own-parser');

var _ownParser2 = _interopRequireDefault(_ownParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Characteristic = void 0;
var UUID = void 0;
var Service = void 0;

var OwnAccessory = function (_Accessory) {
  _inherits(OwnAccessory, _Accessory);

  function OwnAccessory(options) {
    _classCallCheck(this, OwnAccessory);

    var defaultOptions = {
      log: console.log
    };
    var accessoryOptions = (0, _lodash.defaults)(options, defaultOptions);
    if (!accessoryOptions.displayName) {
      accessoryOptions.displayName = accessoryOptions.name;
    }
    if (!accessoryOptions.uuid) {
      accessoryOptions.uuid = UUID.generate(accessoryOptions.name);
    }

    var _this = _possibleConstructorReturn(this, (OwnAccessory.__proto__ || Object.getPrototypeOf(OwnAccessory)).call(this, accessoryOptions.displayName, accessoryOptions.uuid));

    _this.options = accessoryOptions;
    _this.name = _this.options.name;
    _this.ownId = _this.options.ownId;
    _this.log = _this.options.log;
    _this.device = _this.options.device;
    return _this;
  }

  // Return list of services provided by this accessory


  _createClass(OwnAccessory, [{
    key: 'getServices',
    value: function getServices() {
      var infoService = new Service.AccessoryInformation();
      infoService.setCharacteristic(Characteristic.Name, 'Sample accessory').setCharacteristic(Characteristic.Manufacturer, 'Sample manufacturer').setCharacteristic(Characteristic.Model, 'OWN Item');

      return [infoService];
    }
  }]);

  return OwnAccessory;
}(_hapNodejs.Accessory);

var LightOwnAccessory = function (_OwnAccessory) {
  _inherits(LightOwnAccessory, _OwnAccessory);

  function LightOwnAccessory() {
    _classCallCheck(this, LightOwnAccessory);

    return _possibleConstructorReturn(this, (LightOwnAccessory.__proto__ || Object.getPrototypeOf(LightOwnAccessory)).apply(this, arguments));
  }

  _createClass(LightOwnAccessory, [{
    key: 'getServices',
    value: function getServices() {
      var _this3 = this;

      var config = this.options.config;
      var socket = new _ownSocket2.default(config.server, config.port, config.useConn);

      var infoService = new Service.AccessoryInformation();
      infoService.setCharacteristic(Characteristic.Name, 'Light ' + this.ownId).setCharacteristic(Characteristic.Manufacturer, 'OWN Light').setCharacteristic(Characteristic.Model, 'OWN Light item');

      var lightService = new Service.Lightbulb(this.name);
      lightService.getCharacteristic(Characteristic.On)
      // State setter
      .on('set', function (state, cb) {
        socket.send('*1*' + (state ? 1 : 0) + '*' + _this3.ownId + '##', function (err) {
          if (err) return cb(err);
          return cb(null);
        });
      })
      // State getter
      .on('get', function (cb) {
        socket.send('*#1*' + _this3.ownId + '##', function (err, result) {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          var light = _ownParser2.default.parseCode(result[0]);
          return cb(null, light.status);
        });
      });

      return [infoService, lightService];
    }
  }]);

  return LightOwnAccessory;
}(OwnAccessory);

var AutomationOwnAccessory = function (_OwnAccessory2) {
  _inherits(AutomationOwnAccessory, _OwnAccessory2);

  function AutomationOwnAccessory() {
    _classCallCheck(this, AutomationOwnAccessory);

    return _possibleConstructorReturn(this, (AutomationOwnAccessory.__proto__ || Object.getPrototypeOf(AutomationOwnAccessory)).apply(this, arguments));
  }

  _createClass(AutomationOwnAccessory, [{
    key: 'getServices',
    value: function getServices() {
      var _this5 = this;

      this.position = {
        current: 50,
        target: 50
      };

      var config = this.options.config;
      var socket = new _ownSocket2.default(config.server, config.port, config.useConn);

      var infoService = new Service.AccessoryInformation();
      infoService.setCharacteristic(Characteristic.Name, 'Window blind ' + this.ownId).setCharacteristic(Characteristic.Manufacturer, 'OWN Window Blind').setCharacteristic(Characteristic.Model, 'OWN Window Blind item');

      var automationService = new Service.WindowCovering(this.name);
      automationService.getCharacteristic(Characteristic.CurrentPosition)
      // State getter
      .on('set', function (state, cb) {
        _this5.log('Set currentposition %d', state);
      }).on('get', function (cb) {
        return socket.send('*#2*' + _this5.ownId + '##', function (err, result) {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          var automation = _ownParser2.default.parseCode(result[0]);
          if (automation.status === 0) {
            return cb(null, 50);
          } else if (automation.status === 1) {
            return cb(null, 75);
          } else if (automation.status === 2) {
            return cb(null, 25);
          }
          return cb(true);
        });
      });

      automationService.getCharacteristic(Characteristic.TargetPosition)
      // State setter
      .on('set', function (state, cb) {
        return socket.send('*2*' + (state === 100 ? 1 : 2) + '*' + _this5.ownId + '##', function (err, result) {
          if (err) return cb(err);
          return cb(true);
        });
      })
      // State getter
      .on('get', function (cb) {
        return socket.send('*#2*' + _this5.ownId + '##', function (err, result) {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          var automation = _ownParser2.default.parseCode(result[0]);
          if (automation.status === 0) {
            return cb(null, 50);
          } else if (automation.status === 1) {
            return cb(null, 100);
          } else if (automation.status === 2) {
            return cb(null, 0);
          }
          return cb(true);
        });
      });

      automationService.getCharacteristic(Characteristic.PositionState)
      // State getter
      .on('get', function (cb) {
        return socket.send('*#2*' + _this5.ownId + '##', function (err, result) {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          var automation = _ownParser2.default.parseCode(result[0]);
          if (automation.status === 0) {
            return cb(null, Characteristic.PositionState.STOPPED);
          } else if (automation.status === 1) {
            return cb(null, Characteristic.PositionState.INCREASING);
          } else if (automation.status === 2) {
            return cb(null, Characteristic.PositionState.DECREASING);
          }
          return cb(true);
        });
      });

      automationService.getCharacteristic(Characteristic.HoldPosition)
      // State setter
      .on('set', function (state, cb) {
        // Stop
        if (!state) return cb(null); // Do nothing on 'Stop holding'
        return socket.send('*2*0*' + _this5.ownId + '##', function (err, result) {
          if (err) return cb(err);
          return cb(null);
        });
      })
      // State getter
      .on('get', function (cb) {
        return socket.send('*#2*' + _this5.ownId + '##', function (err, result) {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          var automation = _ownParser2.default.parseCode(result[0]);
          return cb(null, automation.status === 0);
        });
      });

      return [infoService, automationService];
    }
  }]);

  return AutomationOwnAccessory;
}(OwnAccessory);

var TempSensorOwnAccessory = function (_OwnAccessory3) {
  _inherits(TempSensorOwnAccessory, _OwnAccessory3);

  function TempSensorOwnAccessory() {
    _classCallCheck(this, TempSensorOwnAccessory);

    return _possibleConstructorReturn(this, (TempSensorOwnAccessory.__proto__ || Object.getPrototypeOf(TempSensorOwnAccessory)).apply(this, arguments));
  }

  _createClass(TempSensorOwnAccessory, [{
    key: 'getServices',
    value: function getServices() {
      var _this7 = this;

      var config = this.options.config;
      var socket = new _ownSocket2.default(config.server, config.port, config.useConn);

      var infoService = new Service.AccessoryInformation();
      infoService.setCharacteristic(Characteristic.Name, 'Temperature ' + this.ownId).setCharacteristic(Characteristic.Manufacturer, 'OWN Temperature').setCharacteristic(Characteristic.Model, 'OWN Temperature sensor');

      var lightService = new Service.TemperatureSensor(this.name);
      lightService.getCharacteristic(Characteristic.CurrentTemperature)
      // State setter
      .on('get', function (cb) {
        socket.send('*#4*' + _this7.ownId + '*0##', function (err, result) {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          var temperature = _ownParser2.default.parseCode(result[0]);
          return cb(null, temperature.status);
        });
      });

      return [infoService, lightService];
    }
  }]);

  return TempSensorOwnAccessory;
}(OwnAccessory);

var OwnAccessoryFactory = function () {
  function OwnAccessoryFactory() {
    _classCallCheck(this, OwnAccessoryFactory);
  }

  _createClass(OwnAccessoryFactory, null, [{
    key: 'getAccessories',
    value: function getAccessories(hbClasses) {
      Characteristic = hbClasses.Characteristic;
      UUID = hbClasses.UUID;
      Service = hbClasses.Service;

      return { LightOwnAccessory: LightOwnAccessory, AutomationOwnAccessory: AutomationOwnAccessory, TempSensorOwnAccessory: TempSensorOwnAccessory };
    }
  }]);

  return OwnAccessoryFactory;
}();

exports.OwnAccessory = OwnAccessory;
exports.LightOwnAccessory = LightOwnAccessory;
exports.AutomationOwnAccessory = AutomationOwnAccessory;
exports.TempSensorOwnAccessory = TempSensorOwnAccessory;
exports.OwnAccessoryFactory = OwnAccessoryFactory;
//# sourceMappingURL=own-accessory.js.map