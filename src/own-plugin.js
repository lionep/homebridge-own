import {OwnPlatformFactory} from './own-platform';

class OwnPlugin {
  static initializer(homebridge) {
    homebridge.registerPlatform('homebridge-own', 'own', OwnPlatformFactory.getPlatform(
      homebridge.hap.Accessory,
      homebridge.hap.Characteristic,
      homebridge.hap.uuid,
      homebridge.hap.Service
    ));
  }
}

export default OwnPlugin.initializer;
