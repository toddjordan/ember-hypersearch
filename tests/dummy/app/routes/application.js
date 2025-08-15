import { Promise } from 'rsvp';
import { A as emberArray } from '@ember/array';
import Route from '@ember/routing/route';

export default class ApplicationRoute extends Route {
  model() {
    return new Promise((resolve, reject) => {
      fetch('/api/v1/users')
        .then((response) => response.json())
        .then((results) => resolve(emberArray(results)))
        .catch(reject);
    });
  }
}
