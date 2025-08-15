import PageObject from './base';
import { findWithAssert } from './base';
import {
  findAll,
  find,
  fillIn,
  click,
  triggerEvent,
} from '@ember/test-helpers';
export default class MainPO extends PageObject {
  constructor() {
    super(...arguments);
  }

  async searchForUserByName(id, value) {
    const input = findWithAssert(`#${id} input`);
    await fillIn(input, value);
    await triggerEvent(find(`#${id} input`), 'blur');
    return this;
  }

  async selectFirstResult() {
    let firstResult = findAll('.hypersearch-result button')[0];
    await click(firstResult);
    return this;
  }

  async assertResultLength(id, expectedLength) {
    this.assert.ok(
      findAll(`#${id} .hypersearch-results li`).length >= expectedLength,
      `it displays ${expectedLength} results`
    );
    return this;
  }

  async assertClosureActionResultsLength(id, expectedLength) {
    let element = find(`.inline-results-length`);
    this.assert.ok(
      element,
      `it displays ${expectedLength} results from the closure action`
    );
    const textContent = element.textContent.trim();
    const hasNumber = /\d+/.test(textContent);

    this.assert.ok(
      hasNumber,
      `Expected element "${element}" to contain a number, but found: "${textContent}"`
    );
    return this;
  }

  async assertEmployeeOfTheDay() {
    this.assert.ok(findWithAssert('#eotd'), 'it displays the selected result');
    this.assert.ok(
      findWithAssert('.marquee'),
      'it displays the selected result'
    );
  }
}
