import {
  find,
  currentURL,
  visit,
  fillIn,
  settled,
  pauseTest,
} from '@ember/test-helpers';

/**
 * Finds an element matching the selector and asserts its existence.
 * Throws if not found.
 * @param {string} selector
 * @return {Element}
 */
export function findWithAssert(selector) {
  let element = find(selector);
  if (!element) {
    throw new Error(`Element not found for selector: ${selector}`);
  }
  return element;
}

export default class PageObject {
  constructor(assert, options) {
    this.assert = assert;
    this.options = options;
  }

  // finders
  findInputByName(name) {
    return findWithAssert(`input[name="${name}"]`);
  }

  findInputsWithErrors(errorSelector = '.has-error') {
    return findWithAssert(`input${errorSelector}`);
  }

  // assertions
  async assertCurrentUrl(targetUrl = `/${this.options.routeName}`) {
    await settled();
    const current = currentURL();
    this.assert.equal(current, targetUrl, 'it redirects to the correct url');
    return this;
  }

  async assertVisitUrl(targetUrl = `/${this.options.routeName}`) {
    await visit(targetUrl);
    await this.assertCurrentUrl(targetUrl);
    return this;
  }

  // interactions
  async fillInByName(name, value) {
    const input = this.findInputByName(name);
    await fillIn(input, value);
    input.dispatchEvent(new Event('focusout', { bubbles: true }));
    await settled();
  }

  // utils
  async pause() {
    await pauseTest();
  }

  async embiggen(testContainerId = 'ember-testing-container') {
    await settled();
    const el = document.getElementById(testContainerId);
    if (el) {
      el.style.width = '100vw';
      el.style.height = '100vh';
    }
  }

  async debug() {
    // eslint-disable-next-line no-unused-vars
    const poInstance = this;
    await settled();
    console.info('Access the PageObject with `poInstance`.');
    // eslint-disable-next-line no-debugger
    debugger;
  }
}
