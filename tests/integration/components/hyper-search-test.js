import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import {
  render,
  fillIn,
  triggerEvent,
  waitUntil,
  findAll,
} from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';
import Pretender from 'pretender';

const SEARCH_RESULTS = {
  id: 1,
  name: 'foobar',
};

const EMAIL_RESULTS = {
  id: 1,
  email: 'pizza@party.com',
};

const DOT_RESULTS = {
  id: 1,
  email: 'lots.of.periods@party.com',
};

module('Integration | Component | hyper-search', function (hooks) {
  setupRenderingTest(hooks);

  let sandbox;

  hooks.beforeEach(function () {
    sandbox = sinon.createSandbox();
    this.server = new Pretender();
    this.requestCount = 0;

    this.server.get('/api/v1/users', () => {
      this.requestCount++;
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([SEARCH_RESULTS]),
      ];
    });
    this.server.get('/api/v1/emails', () => {
      this.requestCount++;
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([EMAIL_RESULTS]),
      ];
    });
    this.server.get('/api/v1/dots', () => {
      this.requestCount++;
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([DOT_RESULTS]),
      ];
    });
  });

  hooks.afterEach(function () {
    sandbox.restore();
    this.server.shutdown();
  });

  test('it renders', async function (assert) {
    this.set('endpoint', '/api/v1/users');
    await render(
      hbs`<HyperSearch data-test-hyper-search @endpoint={{this.endpoint}} />`
    );
    assert.dom('[data-test-hyper-search]').exists();
  });

  test('requestAndCache caches queries and their results', async function (assert) {
    assert.expect(1);
    this.set('endpoint', '/api/v1/users');
    let searchResults = null;
    this.set('onResults', (results) => {
      searchResults = results;
    });

    await render(
      hbs`<HyperSearch data-test-hyper-search @endpoint={{this.endpoint}} @onResults={{this.onResults}} />`
    );
    await fillIn('[data-test-hyper-search] input', 'foo');

    await waitUntil(() => {
      return searchResults !== null;
    });
    assert.deepEqual(searchResults[0], SEARCH_RESULTS);
  });

  test('requestAndCache caches queries with periods', async function (assert) {
    assert.expect(1);
    this.set('endpoint', '/api/v1/emails');
    let searchResults = null;
    this.set('onResults', (results) => {
      searchResults = results;
    });

    await render(
      hbs`<HyperSearch data-test-hyper-search @endpoint={{this.endpoint}} @onResults={{this.onResults}} />`
    );
    await fillIn('[data-test-hyper-search] input', 'pizza');
    await waitUntil(() => {
      return searchResults !== null;
    });
    assert.deepEqual(searchResults[0], EMAIL_RESULTS);
  });

  test('searching twice on the same search text only generates 1 http request', async function (assert) {
    assert.expect(2);
    this.set('endpoint', '/api/v1/users');
    let searchResults = null;
    this.set('onResults', (results) => {
      searchResults = results;
    });

    await render(
      hbs`<HyperSearch data-test-hyper-search @endpoint={{this.endpoint}} @onResults={{this.onResults}} />`
    );

    await fillIn('[data-test-hyper-search] input', 'foobar');
    await waitUntil(() => searchResults !== null);

    // Reset results and search again with the same text
    searchResults = null;
    await fillIn('[data-test-hyper-search] input', 'foobar');
    await waitUntil(() => searchResults !== null);

    assert.equal(
      this.requestCount,
      1,
      'Only one HTTP request was made for repeated search'
    );
    assert.deepEqual(searchResults[0], SEARCH_RESULTS, 'Result is correct');
  });

  test('setting resultKey sets the results property to the values of the resultKey', async function (assert) {
    assert.expect(2);
    this.set('endpoint', '/api/v1/emails');
    this.set('resultKey', 'email');
    let searchResults = null;
    this.set('onResults', (results) => {
      searchResults = results;
    });

    await render(
      hbs`<HyperSearch data-test-hyper-search @endpoint={{this.endpoint}} @resultKey={{this.resultKey}} @onResults={{this.onResults}} />`
    );

    await fillIn('[data-test-hyper-search] input', 'pizza');
    await waitUntil(() => searchResults !== null);

    // Check that the rendered button text matches the email
    assert
      .dom('.hypersearch-result-btn')
      .hasText(EMAIL_RESULTS.email, 'Button displays the email');
    assert.equal(
      searchResults[0].email,
      EMAIL_RESULTS.email,
      'Result object has correct email'
    );
  });

  test('provided selectResult function argument is called when a result is clicked', async function (assert) {
    assert.expect(2);
    this.set('endpoint', '/api/v1/users');
    let selectedResult = null;
    this.set('onSelect', (result) => {
      selectedResult = result;
    });

    await render(
      hbs`<HyperSearch data-test-hyper-search @endpoint={{this.endpoint}} @onSelect={{this.onSelect}} />`
    );

    await fillIn('[data-test-hyper-search] input', 'foobar');
    await waitUntil(() => findAll('.hypersearch-result-btn').length > 0);

    await triggerEvent('.hypersearch-result-btn', 'click');

    assert.ok(selectedResult, 'selectResult was called');
    assert.deepEqual(
      selectedResult,
      SEARCH_RESULTS,
      'selectResult received the correct result'
    );
  });

  test('search can match multiple results', async function (assert) {
    assert.expect(2);
    this.set('endpoint', '/api/v1/users');
    let searchResults = null;
    this.set('onResults', (results) => {
      searchResults = results;
    });

    // Override Pretender response to return multiple results
    this.server.get('/api/v1/users', () => {
      this.requestCount++;
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([
          { id: 1, name: 'foobar' },
          { id: 2, name: 'foobaz' },
          { id: 3, name: 'fooboo' },
        ]),
      ];
    });

    await render(
      hbs`<HyperSearch data-test-hyper-search @endpoint={{this.endpoint}} @onResults={{this.onResults}} />`
    );

    await fillIn('[data-test-hyper-search] input', 'foo');
    await waitUntil(() => searchResults !== null);

    assert.equal(searchResults.length, 3, 'Three results are returned');
    assert.deepEqual(
      searchResults.map((r) => r.name),
      ['foobar', 'foobaz', 'fooboo'],
      'Results contain the expected names'
    );
  });
});
