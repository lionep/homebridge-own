import {defaults} from 'lodash';
import {Accessory} from 'hap-nodejs';
import OwnSocketUtils from './utils/own-socket';
import OwnParser from './utils/own-parser';

let Characteristic;
let UUID;
let Service;

class OwnAccessory extends Accessory {
  constructor(options) {
    const defaultOptions = {
      log: console.log
    };
    const accessoryOptions = defaults(options, defaultOptions);
    if (!accessoryOptions.displayName) {
      accessoryOptions.displayName = accessoryOptions.name;
    }
    if (!accessoryOptions.uuid) {
      accessoryOptions.uuid = UUID.generate(accessoryOptions.name);
    }
    super(accessoryOptions.displayName, accessoryOptions.uuid);

    this.options = accessoryOptions;
    this.name = this.options.name;
    this.ownId = this.options.ownId;
    this.log = this.options.log;
    this.device = this.options.device;
  }

  // Return list of services provided by this accessory
  getServices() {
    const infoService = new Service.AccessoryInformation();
    infoService.setCharacteristic(Characteristic.Name, 'Sample accessory')
      .setCharacteristic(Characteristic.Manufacturer, 'Sample manufacturer')
      .setCharacteristic(Characteristic.Model, 'OWN Item');

    return [infoService];
  }
}

class LightOwnAccessory extends OwnAccessory {
  getServices() {
    const config = this.options.config;
    const socket = new OwnSocketUtils(config.server, config.port, config.useConn);

    const infoService = new Service.AccessoryInformation();
    infoService.setCharacteristic(Characteristic.Name, `Light ${this.ownId}`)
      .setCharacteristic(Characteristic.Manufacturer, 'OWN Light')
      .setCharacteristic(Characteristic.Model, 'OWN Light item');

    const lightService = new Service.Lightbulb(this.name);
    lightService.getCharacteristic(Characteristic.On)
      // State setter
      .on('set', (state, cb) => {
        socket.send(`*1*${state ? 1 : 0}*${this.ownId}##`, (err) => {
          if (err) return cb(err);
          return cb(null);
        });
      })
      // State getter
      .on('get', (cb) => {
        socket.send(`*#1*${this.ownId}##`, (err, result) => {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          const light = OwnParser.parseCode(result[0]);
          return cb(null, light.status);
        });
      });

    return [infoService, lightService];
  }
}

class AutomationOwnAccessory extends OwnAccessory {
  getServices() {
    this.position = {
      current: 50,
      target: 50
    };

    const config = this.options.config;
    const socket = new OwnSocketUtils(config.server, config.port, config.useConn);

    const infoService = new Service.AccessoryInformation();
    infoService.setCharacteristic(Characteristic.Name, `Window blind ${this.ownId}`)
      .setCharacteristic(Characteristic.Manufacturer, 'OWN Window Blind')
      .setCharacteristic(Characteristic.Model, 'OWN Window Blind item');

    const automationService = new Service.WindowCovering(this.name);
    automationService.getCharacteristic(Characteristic.CurrentPosition)
      // State getter
      .on('set', (state, cb) => {
        this.log('Set currentposition %d', state);
      })
      .on('get', (cb) =>
        socket.send(`*#2*${this.ownId}##`, (err, result) => {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          const automation = OwnParser.parseCode(result[0]);
          if (automation.status === 0) {
            return cb(null, 50);
          } else if (automation.status === 1) {
            return cb(null, 75);
          } else if (automation.status === 2) {
            return cb(null, 25);
          }
          return cb(true);
        })
      );

    automationService.getCharacteristic(Characteristic.TargetPosition)
      // State setter
      .on('set', (state, cb) =>
        socket.send(`*2*${state === 100 ? 1 : 2}*${this.ownId}##`, (err, result) => {
          if (err) return cb(err);
          return cb(true);
        })
      )
      // State getter
      .on('get', (cb) =>
        socket.send(`*#2*${this.ownId}##`, (err, result) => {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          const automation = OwnParser.parseCode(result[0]);
          if (automation.status === 0) {
            return cb(null, 50);
          } else if (automation.status === 1) {
            return cb(null, 100);
          } else if (automation.status === 2) {
            return cb(null, 0);
          }
          return cb(true);
        })
      );

    automationService.getCharacteristic(Characteristic.PositionState)
      // State getter
      .on('get', (cb) =>
        socket.send(`*#2*${this.ownId}##`, (err, result) => {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          const automation = OwnParser.parseCode(result[0]);
          if (automation.status === 0) {
            return cb(null, Characteristic.PositionState.STOPPED);
          } else if (automation.status === 1) {
            return cb(null, Characteristic.PositionState.INCREASING);
          } else if (automation.status === 2) {
            return cb(null, Characteristic.PositionState.DECREASING);
          }
          return cb(true);
        })
      );

    automationService.getCharacteristic(Characteristic.HoldPosition)
      // State setter
      .on('set', (state, cb) => {
        // Stop
        if (!state) return cb(null); // Do nothing on 'Stop holding'
        return socket.send(`*2*0*${this.ownId}##`, (err, result) => {
          if (err) return cb(err);
          return cb(null);
        });
      })
      // State getter
      .on('get', (cb) =>
        socket.send(`*#2*${this.ownId}##`, (err, result) => {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          const automation = OwnParser.parseCode(result[0]);
          return cb(null, automation.status === 0);
        })
      );

    return [infoService, automationService];
  }
}

class TempSensorOwnAccessory extends OwnAccessory {
  getServices() {
    const config = this.options.config;
    const socket = new OwnSocketUtils(config.server, config.port, config.useConn);

    const infoService = new Service.AccessoryInformation();
    infoService.setCharacteristic(Characteristic.Name, `Temperature ${this.ownId}`)
      .setCharacteristic(Characteristic.Manufacturer, 'OWN Temperature')
      .setCharacteristic(Characteristic.Model, 'OWN Temperature sensor');

    const lightService = new Service.TemperatureSensor(this.name);
    lightService.getCharacteristic(Characteristic.CurrentTemperature)
      // State setter
      .on('get', (cb) => {
        socket.send(`*#4*${this.ownId}*0##`, (err, result) => {
          if (err) return cb(err);
          if (result.length === 0) return cb(new Error('no result'));
          const temperature = OwnParser.parseCode(result[0]);
          return cb(null, temperature.status);
        });
      });

    return [infoService, lightService];
  }
}


class OwnAccessoryFactory {
  static getAccessories(hbClasses) {
    Characteristic = hbClasses.Characteristic;
    UUID = hbClasses.UUID;
    Service = hbClasses.Service;

    return {LightOwnAccessory, AutomationOwnAccessory, TempSensorOwnAccessory};
  }
}

export {
  OwnAccessory,
  LightOwnAccessory,
  AutomationOwnAccessory,
  TempSensorOwnAccessory,
  OwnAccessoryFactory
};
