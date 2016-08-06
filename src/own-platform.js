import {defaults, times} from 'lodash';
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
      port: 20000
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

    if (this.config.scanLights) {
      // Send light probe
      socket.send('*#1*0##', (err, lights) => {
        if (err) this.log.error(err);
        this.log('Lights : %j', lights);

        lights.forEach((lightCode) => {
          const light = OwnParser.parseCode(lightCode);

          accessories.push(new LightOwnAccessory({
            log: this.log,
            name: `light ${light.id}`,
            ownId: light.id,
            config: this.config
          }));
        });

        lightsFound = true;
        sendCallback();
      });
    }

    if (this.config.scanAutomations) {
      // Send automation probe
      socket.send('*#2*0##', (err, automations) => {
        if (err) this.log.error(err);
        this.log('Automations : %j', automations);

        automations.forEach((automationCode) => {
          const automation = OwnParser.parseCode(automationCode);

          accessories.push(new AutomationOwnAccessory({
            log: this.log,
            name: `automation ${automation.id}`,
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

          tempSensors.forEach((tempSensorCode) => {
            const tempSensor = OwnParser.parseCode(tempSensorCode);

            accessories.push(new TempSensorOwnAccessory({
              log: this.log,
              name: `temp sensor ${tempSensor.id}`,
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
