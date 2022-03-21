import Controller from './controller.js';
import service from './service.js';
import View from './view.js';

const url = `${window.location.origin}/controller`
Controller.initialize({
  view: new View(),
  service: new service({url})
})