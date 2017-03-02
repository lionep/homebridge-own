import {defaults, times, has, includes} from 'lodash';
import Promise from 'bluebird';
import {OwnAccessoryFactory} from './own-accessory';
import OwnSocketUtils from './utils/own-socket';
import OwnParser from './utils/own-parser';

let Accessory;
let Characteristic;
let UUID;
let Service;

class OwnPlatform {
  constructor(log, config, api) {
    this.log = log || console.log;

    this.log('Constructing platform...');
    const defaultConfig = {
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

    this.config = defaults(config, defaultConfig);
    if (!config.server) {
      throw new Error('Missing config.server in platform');
    }
  }

  // Fetch accessories
  accessories(cb) {
    this.log('Fetch OWN accessories');
    const classes = {Accessory, Characteristic, UUID, Service};
    const {LightOwnAccessory, AutomationOwnAccessory, TempSensorOwnAccessory} = OwnAccessoryFactory.getAccessories(classes);

    const accessories = [];

    let lightsFound = false;
    let automationsFound = false;
    let tempFound = false;

    const sendCallback = () => {
      if ((lightsFound || !this.config.scanLights)
          && (automationsFound || !this.config.scanAutomations)
          && (tempFound || !this.config.scanTempSensors)) {
        cb(accessories);
      }
    };

    const socket = new OwnSocketUtils(this.config.server, this.config.port);
    const scanResults = (lights, callback) => {
      const lightIds = [];
      this.log('Lights : %j', lights);

      lights.forEach((lightCode) => {
        const light = OwnParser.parseCode(lightCode);
        // Ignore duplicate ids
        if (includes(lightIds, light.id)) return;
        lightIds.push(light.id);
        let name = `light ${light.id}`;
        if (has(this.config, `bindings.lights.${light.id}`)) {
          name = this.config.bindings.lights[light.id];
        }
        accessories.push(new LightOwnAccessory({
          log: this.log,
          name,
          ownId: light.id,
          config: this.config
        }));
      });

      lightsFound = true;

      callback();
    };

    if (this.config.scanLights) {
      // Send light probe
      socket.send('*#1*0##', (err, lights) => {
        if (err) {
          this.log.error(err);
          if (err.message === 'NACK') {
            this.log('Retry with prefix *99*1##');
            socket.send(['*99*1##', '*#1*0##'], (err2, lights2) => {
              if (err2) {
                this.log('Failure.');
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
      socket.send('*#2*0##', (err, automations) => {
        if (err) this.log.error(err);
        const automationIds = [];
        this.log('Automations : %j', automations);

        automations.forEach((automationCode) => {
          const automation = OwnParser.parseCode(automationCode);
          // Ignore duplicate ids
          if (includes(automationIds, automation.id)) return;
          automationIds.push(automation.id);
          let name = `automation ${automation.id}`;
          if (has(this.config, `bindings.automations.${automation.id}`)) {
            name = this.config.bindings.automations[automation.id];
          }
          accessories.push(new AutomationOwnAccessory({
            log: this.log,
            name,
            ownId: automation.id,
            config: this.config
          }));
        });

        automationsFound = true;
        sendCallback();
      });
    }

    if (this.config.scanTempSensors) {
      const sensorsTry = times(this.config.maxTempSensors, i => i + 1);
      let falseFound = false;
      Promise.mapSeries(sensorsTry, (index) =>
          new Promise((resolve, reject) => {
            if (falseFound) return resolve(false);

            return socket.send(`*#4*${index}*0##`, (err, result) => {
              if (err) {
                falseFound = true;
                return resolve(false);
              }
              if (result.length > 0) return resolve(result[0]);
              falseFound = true;
              return resolve(false);
            });
          })
        )
        .filter((value) => !!value)
        .then((tempSensors) => {
          this.log('Temp sensors : %j', tempSensors);
          const tempSensorIds = [];
          tempSensors.forEach((tempSensorCode) => {
            const tempSensor = OwnParser.parseCode(tempSensorCode);
            // Ignore duplicate ids
            if (includes(tempSensorIds, tempSensor.id)) return;
            tempSensorIds.push(tempSensor.id);
            let name = `temp sensor ${tempSensor.id}`;
            if (has(this.config, `bindings.temps.${tempSensor.id}`)) {
              name = this.config.bindings.temps[tempSensor.id];
            }
            accessories.push(new TempSensorOwnAccessory({
              log: this.log,
              name,
              ownId: tempSensor.id,
              config: this.config
            }));
          });

          tempFound = true;
          sendCallback();
        });
    }
  }
}


// Own Platform Factory
// Allow to import Accessory, Characteristic and UUIDGen objects from homebridge
class OwnPlatformFactory {
  static getPlatform(hbAccessory, hbCharacteristic, hbUUID, hbService) {
    Accessory = hbAccessory;
    Characteristic = hbCharacteristic;
    UUID = hbUUID;
    Service = hbService;

    return OwnPlatform;
  }
}

export {
  OwnPlatform,
  OwnPlatformFactory
};
