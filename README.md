# homebridge-own

This project is an homebridge plugin for OpenWebNet standard.  
It has been tested on one installation only, on bticino/legrand hardware.

## Installation

```
npm install -g homebridge
npm install -g homebridge-own
```

In homebridge `config.json`, add this platform :

```
{
  "platform" : "own",
  "name" : "OwnServer",
  "server": "192.168.0.20"
}
```

With `192.168.0.20` your local OWN server IP.

Other config options :

- `scanLights`: boolean, enable the light discovery (WHO=1) (default: true)
- `scanAutomations`: boolean, enable the automations discovery (WHO=2) (default: true)
- `scanTempSensors`: boolean, enable the temperature sensors discovery (WHO=4) (default: true)
- `maxTempSensors`: number, maximum id of temp sensor discovery (default: 20)
- `port`: number, server TCP port (default: 20000)
- `timeout`: number, useless at the moment (default: 5)

Have a look at the [homebridge project](https://github.com/nfarina/homebridge)

## Issues

If you have any issue in the use of this plugin, use [this page](https://github.com/lionep/homebridge-own/issues) to submit it.
