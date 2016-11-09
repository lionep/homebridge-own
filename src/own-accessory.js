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
      accessoryOptions.displayName = accessoryOptions.name + '_';
    }
    if (!accessoryOptions.uuid) {
      accessoryOptions.uuid = UUID.generate(accessoryOptions.name + '_a');
    }
    super(accessoryOptions.displayName + '_as', accessoryOptions.uuid);

    this.options = accessoryOptions;
    this.name = this.options.name + '__a';
    this.ownId = this.options.ownId;
    this.log = this.options.log;
    this.device = this.options.device;

    this.chars = {};
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
    const socket = new OwnSocketUtils(config.server, config.port);

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

// Automations : window blinds
// OWN
class AutomationOwnAccessory extends OwnAccessory {
  setTargetPosition(target, done) {
    // Cancel current moves
    if (this.interval || this.timeout) {
      clearInterval(this.interval);
      clearTimeout(this.timeout);
      // this.timeoutCB(null);
      this.interval = null;
      this.timeout = null;
      this.timeoutCB = null;
    }

    const initialPosition = this.position.current;

    this.position.target = target;
    this.log('Targeting position %j', target);

    // End of move ETA
    const directionDown = this.position.current > this.position.target;
    const moveDelta = Math.abs(this.position.current - this.position.target);
    const eta = Math.round((moveDelta / 100) * this.timings.ajar * 1000);
    this.log('MoveDelta : %d ETA : %dms.', moveDelta, eta);

    let elapsed = 0;
    this.notifyPositionStateValueChange();

    this.interval = setInterval(() => {
      elapsed += 1000;
      const deltaEta = moveDelta * (elapsed / eta);
      const move = directionDown ? initialPosition - deltaEta : initialPosition + deltaEta;
      this.position.current = Math.round(move);
      this.log('Progressive move %j', this.position.current);
      this.notifyCurrentPositionValueChange();
    }, 1000);

    // this.timeoutCB = done;
    done();

    this.timeout = setTimeout(() => {
      this.log('Ended movement at %d', target);
      clearInterval(this.interval);
      this.position.current = target;
      this.interval = null;
      this.timeout = null;
      this.timeoutCB = null;
      this.notifyPositionStateValueChange();
    }, eta);
  }

  notifyCurrentPositionValueChange() {
    this.log('Notify position change setValue(%d)', this.position.current);
    this.chars.currentPosition.setValue(this.position.current);
  }

  notifyPositionStateValueChange() {
    if (this.position.target === this.position.current) {
      this.log('Notify position change setValue(%d)', Characteristic.PositionState.STOPPED);
      this.chars.positionState.setValue(Characteristic.PositionState.STOPPED);
    } else if (this.position.target > this.position.current) {
      this.log('Notify position change setValue(%d)', Characteristic.PositionState.INCREASING);
      this.chars.positionState.setValue(Characteristic.PositionState.INCREASING); // up
    } else if (this.position.target < this.position.current) {
      this.log('Notify position change setValue(%d)', Characteristic.PositionState.DECREASING);
      this.chars.positionState.setValue(Characteristic.PositionState.DECREASING); // down
    }
  }

  getServices() {
    this.position = {
      current: 50, // Arbitrary defined initial position
      target: 50
    };

    const config = this.options.config;
    const socket = new OwnSocketUtils(config.server, config.port);

    this.timings = {
      ajar: config.automationDefaultAjarTiming,
      complete: config.automationDefaultCompleteTiming
    };
    const ownIdStr = this.ownId.toString();
    if ({}.hasOwnProperty.call(config.automationTimings, ownIdStr)) {
      if (config.automationTimings[ownIdStr].ajar) {
        this.timings.ajar = config.automationTimings[ownIdStr].ajar;
      }
      if (config.automationTimings[ownIdStr].complete) {
        this.timings.complete = config.automationTimings[ownIdStr].complete;
      }
    }

    console.log(this.ownId, this.timings);

    const infoService = new Service.AccessoryInformation();
    infoService.setCharacteristic(Characteristic.Name, `Window blind ${this.ownId}`)
      .setCharacteristic(Characteristic.Manufacturer, 'OWN Window Blind')
      .setCharacteristic(Characteristic.Model, 'OWN Window Blind item');

    const automationService = new Service.WindowCovering(this.name);
    this.chars.currentPosition = automationService.getCharacteristic(Characteristic.CurrentPosition) // READ, NOTIFY
      // State getter
      .on('get', (cb) => {
        this.log('Get current position');
        cb(null, this.position.current);
        /*
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
        */
      });

    this.chars.targetPosition = automationService.getCharacteristic(Characteristic.TargetPosition); // READ, WRITE, NOTIFY

    this.chars.targetPosition
      // State setter
      .on('set', (target, cb) => {
        this.log('Set position to state %j', target);

        // Except direction change @TODO
        // if (this.position.current !== this.position.target) {
        //   this.log('One movement is already in progress');
        //   return cb(true);
        // }
        return this.setTargetPosition(target, (err) => {
          this.log('Finished movement instruction!');
          if (err) this.log(err);
          return cb();
        });


        // Simulation
        /*
        socket.send(`*2*${state === 100 ? 1 : 2}*${this.ownId}##`, (err, result) => {
          if (err) return cb(err);
          return setTimeout(() => {
            cb(null, state);
          }, 1000);
          // return cb(null, state);
        });
        */
      })

      // State getter
      .on('get', (cb) => {
        this.log('Get position target');
        cb(null, this.position.target);
        /*
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
          this.log('No matching status "%j"', automation.status);
          return cb(true);
        });
        */
      });

    this.chars.positionState = automationService.getCharacteristic(Characteristic.PositionState) // READ, NOTIFY
      // State getter
      .on('get', (cb) => {
        this.log('Get position state');
        if (this.position.target === this.position.current) {
          cb(null, Characteristic.PositionState.STOPPED);
        } else if (this.position.target > this.position.current) {
          cb(null, Characteristic.PositionState.INCREASING); // up
        } else if (this.position.target < this.position.current) {
          cb(null, Characteristic.PositionState.DECREASING); // down
        }
        //
        // return socket.send(`*#2*${this.ownId}##`, (err, result) => {
        //   if (err) return cb(err);
        //   if (result.length === 0) return cb(new Error('no result'));
        //   const automation = OwnParser.parseCode(result[0]);
        //   if (automation.status === 0) {
        //     return cb(null, Characteristic.PositionState.STOPPED);
        //   } else if (automation.status === 1) {
        //     return cb(null, Characteristic.PositionState.INCREASING);
        //   } else if (automation.status === 2) {
        //     return cb(null, Characteristic.PositionState.DECREASING);
        //   }
        //   this.log('No matching status "%j"', automation.status);
        //   return cb(true);
        // });
      });


    /*
    automationService.getCharacteristic(Characteristic.HoldPosition) // WRITE
      // State setter
      .on('set', (state, cb) => {
        this.log('Set hold position to state %j', state);
        // Stop
        if (!state) return cb(null); // Do nothing on 'Stop holding'
        return socket.send(`*2*0*${this.ownId}##`, (err, result) => {
          if (err) return cb(err);
          return cb(null);
        });
      });

    */

    return [infoService, automationService];
  }
}

// Temp sensor : return temperature read-only
class TempSensorOwnAccessory extends OwnAccessory {
  getServices() {
    const config = this.options.config;
    const socket = new OwnSocketUtils(config.server, config.port);

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

// OWN Accessory factory : set required global classes
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
