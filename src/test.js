import OwnSocketUtils from './utils/own-socket';

// Status
const start = Date.now();
OwnSocketUtils.send('10.0.0.23', 20000, '*#1*11##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send('10.0.0.23', 20000, '*#1*12##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send('10.0.0.23', 20000, '*#1*15##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send('10.0.0.23', 20000, '*#1*16##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
OwnSocketUtils.send('10.0.0.23', 20000, '*#1*17##', (err, res) => {
  if (err) console.error(err);
  console.log(res);
  console.log(`${Date.now() - start}ms`);
});
