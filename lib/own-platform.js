'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OwnPlatformFactory = exports.OwnPlatform = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _ownAccessory = require('./own-accessory');

var _ownSocket = require('./utils/own-socket');

var _ownSocket2 = _interopRequireDefault(_ownSocket);

var _ownParser = require('./utils/own-parser');

var _ownParser2 = _interopRequireDefault(_ownParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Accessory = void 0;
var Characteristic = void 0;
var UUID = void 0;
var Service = void 0;

var OwnPlatform = function () {
  function OwnPlatform(log, config, api) {
    _classCallCheck(this, OwnPlatform);

    this.log = log || console.log;

    this.log('Constructing platform...');
    var defaultConfig = {
      timeout: 5,
      scanLights: true,
      scanAutomations: true,
      scanTempSensors: true,
      maxTempSensors: 20,
      port: 20000,
      bindings: {
        lights: {},
        temps: {},
        automations: {}
      }
    };

    this.config = (0, _lodash.defaults)(config, defaultConfig);
    if (!config.server) {
      throw new Error('Missing config.server in platform');
    }
  }

  // Fetch accessories


  _createClass(OwnPlatform, [{
    key: 'accessories',
    value: function accessories(cb) {
      var _this = this;

      this.log('Fetch OWN accessories');
      var classes = { Accessory: Accessory, Characteristic: Characteristic, UUID: UUID, Service: Service };

      var _OwnAccessoryFactory$ = _ownAccessory.OwnAccessoryFactory.getAccessories(classes);

      var LightOwnAccessory = _OwnAccessoryFactory$.LightOwnAccessory;
      var AutomationOwnAccessory = _OwnAccessoryFactory$.AutomationOwnAccessory;
      var TempSensorOwnAccessory = _OwnAccessoryFactory$.TempSensorOwnAccessory;


      var accessories = [];

      var lightsFound = false;
      var automationsFound = false;
      var tempFound = false;

      var sendCallback = function sendCallback() {
        if ((lightsFound || !_this.config.scanLights) && (automationsFound || !_this.config.scanAutomations) && (tempFound || !_this.config.scanTempSensors)) {
          cb(accessories);
        }
      };

      var socket = new _ownSocket2.default(this.config.server, this.config.port);
      var scanResults = function scanResults(lights, callback) {
        var lightIds = [];
        _this.log('Lights : %j', lights);

        lights.forEach(function (lightCode) {
          var light = _ownParser2.default.parseCode(lightCode);
          // Ignore duplicate ids
          if ((0, _lodash.includes)(lightIds, light.id)) return;
          lightIds.push(light.id);
          var name = 'light ' + light.id;
          if ((0, _lodash.has)(_this.config, 'bindings.lights.' + light.id)) {
            name = _this.config.bindings.lights[light.id];
          }
          accessories.push(new LightOwnAccessory({
            log: _this.log,
            name: name,
            ownId: light.id,
            config: _this.config
          }));
        });

        lightsFound = true;

        callback();
      };

      if (this.config.scanLights) {
        // Send light probe
        socket.send('*#1*0##', function (err, lights) {
          if (err) {
            _this.log.error(err);
            if (err.message === 'NACK') {
              _this.log('Retry with prefix *99*1##');
              socket.send(['*99*1##', '*#1*0##'], function (err2, lights2) {
                if (err2) {
                  _this.log('Failure.');
                  return;
                }
                scanResults(lights2, sendCallback);
              });
              return;
            }
          }
          scanResults(lights, sendCallback);
        });
      }

      if (this.config.scanAutomations) {
        // Send automation probe
        socket.send('*#2*0##', function (err, automations) {
          if (err) _this.log.error(err);
          var automationIds = [];
          _this.log('Automations : %j', automations);

          automations.forEach(function (automationCode) {
            var automation = _ownParser2.default.parseCode(automationCode);
            // Ignore duplicate ids
            if ((0, _lodash.includes)(automationIds, automation.id)) return;
            automationIds.push(automation.id);
            var name = 'automation ' + automation.id;
            if ((0, _lodash.has)(_this.config, 'bindings.automations.' + automation.id)) {
              name = _this.config.bindings.automations[automation.id];
            }
            accessories.push(new AutomationOwnAccessory({
              log: _this.log,
              name: name,
              ownId: automation.id,
              config: _this.config
            }));
          });

          automationsFound = true;
          sendCallback();
        });
      }

      if (this.config.scanTempSensors) {
        (function () {
          var sensorsTry = (0, _lodash.times)(_this.config.maxTempSensors, function (i) {
            return i + 1;
          });
          var falseFound = false;
          _bluebird2.default.mapSeries(sensorsTry, function (index) {
            return new _bluebird2.default(function (resolve, reject) {
              if (falseFound) return resolve(false);

              return socket.send('*#4*' + index + '*0##', function (err, result) {
                if (err) {
                  falseFound = true;
                  return resolve(false);
                }
                if (result.length > 0) return resolve(result[0]);
                falseFound = true;
                return resolve(false);
              });
            });
          }).filter(function (value) {
            return !!value;
          }).then(function (tempSensors) {
            _this.log('Temp sensors : %j', tempSensors);
            var tempSensorIds = [];
            tempSensors.forEach(function (tempSensorCode) {
              var tempSensor = _ownParser2.default.parseCode(tempSensorCode);
              // Ignore duplicate ids
              if ((0, _lodash.includes)(tempSensorIds, tempSensor.id)) return;
              tempSensorIds.push(tempSensor.id);
              var name = 'temp sensor ' + tempSensor.id;
              if ((0, _lodash.has)(_this.config, 'bindings.temps.' + tempSensor.id)) {
                name = _this.config.bindings.temps[tempSensor.id];
              }
              accessories.push(new TempSensorOwnAccessory({
                log: _this.log,
                name: name,
                ownId: tempSensor.id,
                config: _this.config
              }));
            });

            tempFound = true;
            sendCallback();
          });
        })();
      }
    }
  }]);

  return OwnPlatform;
}();

// Own Platform Factory
// Allow to import Accessory, Characteristic and UUIDGen objects from homebridge


var OwnPlatformFactory = function () {
  function OwnPlatformFactory() {
    _classCallCheck(this, OwnPlatformFactory);
  }

  _createClass(OwnPlatformFactory, null, [{
    key: 'getPlatform',
    value: function getPlatform(hbAccessory, hbCharacteristic, hbUUID, hbService) {
      Accessory = hbAccessory;
      Characteristic = hbCharacteristic;
      UUID = hbUUID;
      Service = hbService;

      return OwnPlatform;
    }
  }]);

  return OwnPlatformFactory;
}();

exports.OwnPlatform = OwnPlatform;
exports.OwnPlatformFactory = OwnPlatformFactory;
//# sourceMappingURL=own-platform.js.map