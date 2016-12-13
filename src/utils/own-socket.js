import {chain} from 'lodash';
import net from 'net';

export default class OwnSocketUtils {
  static ACK = '*#*1##';
  static NACK = '*#*0##';

  static MSG_SEP = '##';

  constructor(host, port) {
    this.host = host;
    this.port = port;
  }

  send(message, callback) {
    OwnSocketUtils.send(this.host, this.port, message, callback);
  }

  static readResponse(res) {
    if (res === OwnSocketUtils.ACK) {
      return {ack: true};
    } else if (res === OwnSocketUtils.NACK) {
      return {ack: false};
    }
    return {msg: res};
  }

  static send(host, port, message, callback) {
    const socket = new net.Socket();
    let responses = [];

    // Send message after connection
    socket.connect({
      port,
      host
    }, () => {
      socket.end(message);
    });

    // Send response on end
    socket.on('end', () => {
      let hasError = false;
      const returnedResponses = [];
      responses.forEach((response, index) => {
        const res = OwnSocketUtils.readResponse(response);
        if (index === 0 && res.ack) return; // Ignore first ack
        if (!res.ack) {
          hasError = true;
          return;
        }
        if (res.msg) {
          returnedResponses.push(res.msg);
        }
      });

      callback(hasError ? new Error('NACK') : null, returnedResponses);
    });

    // Append data to responses (resplit if necessary)
    socket.on('data', (buf) => {
      responses = responses.concat(chain(buf.toString().split(OwnSocketUtils.MSG_SEP))
        .filter((res) => res !== '')
        .map((res) =>
          `${res}${OwnSocketUtils.MSG_SEP}`
        ).value());
    });
  }
}
