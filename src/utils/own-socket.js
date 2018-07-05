import {chain, isArray} from 'lodash';
import net from 'net';
import Promise from 'bluebird';

export default class OwnSocketUtils {
  static ACK = '*#*1##';
  static NACK = '*#*0##';
  static CONN = '*99*9##';

  static MSG_SEP = '##';

  constructor(host, port, useConn) {
    this.host = host;
    this.port = port;
    this.useConn = useConn;
  }

  send(message, callback) {
    OwnSocketUtils.send(this.host, this.port, this.useConn, message, callback);
  }

  static readResponse(res) {
    if (res === OwnSocketUtils.ACK) {
      return {ack: true};
    } else if (res === OwnSocketUtils.NACK) {
      return {ack: false};
    }
    return {msg: res};
  }

  static send(host, port, useConn, message, callback) {
    // console.log(`Establishing connection to ${host}`);
    const socket = new net.Socket();
    let responses = [];

    let connAck = false;
    let connSend = false;

    // Send message after connection
    socket.connect({
      port,
      host
    }, () => {
      return Promise.resolve()
        .then(() => {
          if (!useConn) return true;
          return new Promise((resolve, reject) => {
            socket.once('data', (buf) => {
              if (buf.toString() === OwnSocketUtils.ACK) return resolve();
              return reject();
            });
          })
          .then(() => {
            // console.log('Send CONN');
            socket.write(OwnSocketUtils.CONN);
            return new Promise((resolve, reject) => {
              socket.once('data', (buf) => {
                if (buf.toString() === OwnSocketUtils.ACK) {
                  // connSend = true;
                  return resolve();
                }
                return reject();
              });
            });
          })
        })
        .then(() => {
          if (isArray(message)) {
            message.forEach((messageItem) => {
              // console.log(`write ${messageItem}`);
              socket.write(messageItem);
            });
            // socket.end();
          } else {
            // console.log(`write single ${message}`);
            socket.write(message);
            // socket.end();
          }
        })


    });

    // Send response on end
    socket.on('end', () => {
      // console.log('end');
      let hasError = false;
      const returnedResponses = [];
      responses.forEach((response, index) => {
        const res = OwnSocketUtils.readResponse(response);
        // if (index === 0 && res.ack) {
        //   console.log('ACK');
        //   return; // Ignore first ack
        // }
        if (res.ack === false) {
          // console.log('NACK');
          hasError = true;
          return;
        }
        if (res.msg) {
          // console.log(`RES : ${res.msg}`);
          returnedResponses.push(res.msg);
        }
      });

      callback(hasError ? new Error('NACK') : null, returnedResponses);
    });

    // Append data to responses (resplit if necessary)
    socket.on('data', (buf) => {
      const res = buf.toString();
      if (res === OwnSocketUtils.ACK && !connAck) {
        connAck = true;
        return;
      }
      if (res === OwnSocketUtils.ACK && !connSend) {
        connSend = true;
        return;
      }
      if (res === OwnSocketUtils.ACK && connSend && connAck) {
        socket.end();
      }
      responses = responses.concat(chain(buf.toString().split(OwnSocketUtils.MSG_SEP))
        .filter((res) => res !== '')
        .map((res) =>
          `${res}${OwnSocketUtils.MSG_SEP}`
        ).value());
    });
  }
}
