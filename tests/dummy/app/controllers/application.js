import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {
  @tracked selectedEmployee = null;
  @tracked results = null;

  @action
  selectResult(result) {
    this.selectedEmployee = result;
  }

  @action
  handleResults(results) {
    this.results = results;
  }
}
