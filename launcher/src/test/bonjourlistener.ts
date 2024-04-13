// https://github.com/watson/bonjour

import bonjour = require("bonjour");

let bonjourInstance: bonjour.Bonjour;
let bonjourOptions: bonjour.BonjourOptions;
bonjourOptions = {};
bonjourInstance = bonjour(bonjourOptions);
let browser: bonjour.Browser;

// Listen for new services
browser = bonjourInstance.findOne({ type: 'http' }, (service) => {
    console.log('Service found:', service.name, service.host);
});

// Listen for service disappearances
browser.on('down', (service) => {
    console.log('Service lost:', service.name);
});

// Listen for service disappearances
browser.on('up', (service) => {
    console.log('Service up:', service.name);
});

setInterval(() => { console.log("update"); browser.update()}, 1000);
