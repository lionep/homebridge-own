import OwnSocketUtils from './utils/own-socket';

const ip = '192.168.1.250';
// const ip = '10.0.0.178';

// Status
const start = Date.now();
OwnSocketUtils.send(ip, 20000, true, '*#1*0##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});

/*
OwnSocketUtils.send(ip, 20000, '*#1*12##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send(ip, 20000, '*#1*15##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send(ip, 20000, '*#1*16##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send(ip, 20000, '*#1*17##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
*/
