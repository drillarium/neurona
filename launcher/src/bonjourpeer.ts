import bonjour = require("bonjour");
import { logger } from './logger';

// Create a new Bonjour instance
var bonjourInstance: bonjour.Bonjour;
var service: bonjour.Service;

export function initBonjour(name: string, address: string, port: number) {
  var bonjourOptions: bonjour.BonjourOptions = {};
  bonjourInstance = bonjour(bonjourOptions);
  var serviceOptions: bonjour.ServiceOptions;
  if(address != "0.0.0.0") {
    serviceOptions = { name: name, type: "http", port: port, host: address };
  }
  else {
    serviceOptions = { name: name, type: "http", port: port };
  }
  service = bonjourInstance.publish(serviceOptions);
  logger.info(`Bonjour is running ${JSON.stringify(serviceOptions)}`);
}

/*
export function deinitBonjour() {
  bonjourInstance.destroy();
  logger.info(`Bonjour destroy`);
}
*/

export async function deinitBonjour() {
  return new Promise((resolve, reject) => {

    bonjourInstance.unpublishAll(() => {
      logger.info(`Bonjour destroy`);
      bonjourInstance?.destroy();
      resolve({});
    });
    
    /*
    // goodbye message
    service.stop(() => {
      logger.info(`Bonjour service stop`);
      bonjourInstance.unpublishAll(() => {
        logger.info(`Bonjour destroy`);
        bonjourInstance?.destroy();
        resolve({});      
      });
    });
    */
  });
}
