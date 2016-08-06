export default class OwnParser {

  static getWhoType(who) {
    const whoInt = parseInt(who, 10);
    switch (whoInt) {
      case 0 :
        return 'scenario';
      case 1 :
        return 'light';
      case 2 :
        return 'automation';
      case 3 :
        return 'load';
      case 4 :
        return 'temperature';
      case 5 :
        return 'burglar-alarm';
      case 7 :
        return 'video-door';
      case 13 :
        return 'gateway';
      case 15 :
      case 25 :
        return 'CEN';
      case 16 :
        return 'sound-system';
      case 22 :
        return 'sound-diffusion';
      case 17 :
        return 'scene';
      case 18 :
        return 'energy';
      default:
        return null;
    }
  }

  static getStatus(who, state) {
    const whoInt = parseInt(who, 10);
    const stateInt = parseInt(state, 10);
    switch (whoInt) {
      case 1 :
        // light
        switch (stateInt) {
          case 0:
            return false;
          case 1:
            return true;
          default:
            return null;
        }

      case 2 :
        // automation
        return stateInt;

      case 4 :
        // temperature
        return stateInt / 10;

      default:
        return null;
    }
  }

  static parseCode(code) {
    if (typeof code !== 'string') return {};
    const reGen = /^\*([0-9]+)\*([0-2])\*([0-9]+)##$/i;
    // *#4*3*0*0284##
    const reTemp = /^\*#4\*([0-9]+)\*0\*([0-9]+)##$/i;

    if (reGen.test(code)) {
      const response = code.match(reGen);
      if (response.length < 4) return {};

      return {
        type: OwnParser.getWhoType(response[1]),
        id: parseInt(response[3], 10),
        status: OwnParser.getStatus(response[1], response[2])
      };
    } else if (reTemp.test(code)) {
      const response = code.match(reTemp);
      if (response.length < 3) return {};

      return {
        type: OwnParser.getWhoType('4'),
        id: parseInt(response[1], 10),
        status: OwnParser.getStatus('4', response[2])
      };
    }
    return {};
  }

}
