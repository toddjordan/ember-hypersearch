import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import Pretender from 'pretender';
import MainPO from '../../tests/helpers/page-objects/main';

module('Acceptance | main', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.server = new Pretender();
    // Handle the GET request for /api/v1/users
    this.server.get('/api/v1/users', function () {
      // You can customize this JSON
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([{ id: 1, name: 'Alice' }]),
      ];
    });
  });

  hooks.afterEach(function () {
    this.server.shutdown();
  });

  test('renders results', async function (assert) {
    let mainPo = new MainPO(assert, { routeName: '/' });
    mainPo = await mainPo.assertVisitUrl();
    mainPo = await mainPo.searchForUserByName('component-block', 'a');
    await mainPo.assertResultLength('component-block', 1);
  });

  test('handles selecting results', async function (assert) {
    let mainPo = await new MainPO(assert, { routeName: '/' }).assertVisitUrl();
    mainPo = await mainPo.searchForUserByName('component-block', 'a');
    mainPo = await mainPo.selectFirstResult();
    await mainPo.assertEmployeeOfTheDay();
  });

  test('does not search if the query is shorter than the `minQueryLength`', async function (assert) {
    let mainPo = await new MainPO(assert, { routeName: '/' }).assertVisitUrl();
    mainPo = await mainPo.searchForUserByName('component-inline', 'a');
    await mainPo.assertResultLength('component-inline', 0);
  });

  test('accepts a `resultKey`', async function (assert) {
    let mainPo = await new MainPO(assert, { routeName: '/' }).assertVisitUrl();
    mainPo = await mainPo.searchForUserByName(
      'component-inline',
      'Miss Adan Gorczany'
    );
    await mainPo.assertResultLength('component-inline', 1);
  });

  test('handles results', async function (assert) {
    let mainPo = await new MainPO(assert, { routeName: '/' }).assertVisitUrl();
    mainPo = await mainPo.searchForUserByName(
      'component-inline',
      'Miss Adan Gorczany'
    );
    await mainPo.assertClosureActionResultsLength('component-inline', 1);
  });
});
