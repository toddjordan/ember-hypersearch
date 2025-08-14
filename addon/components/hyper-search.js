import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isBlank, isPresent } from '@ember/utils';

// Util: safe cache key
function safeKeyString(query) {
  return query.replace(/\./g, '-');
}

export default class HyperSearchComponent extends Component {
  constructor() {
    super(...arguments);
    console.log('HyperSearchComponent initialized with args:', this.args);
    // You can add any setup code here if needed
  }

  // Arguments
  get minQueryLength() {
    return this.args.minQueryLength ?? 3;
  }
  get debounceRate() {
    return this.args.debounceRate ?? 0;
  }
  get endpoint() {
    return this.args.endpoint;
  }
  get resultKey() {
    return this.args.resultKey;
  }
  get placeholder() {
    return this.args.placeholder;
  }

  // State
  _cache = {};
  @tracked results = [];

  // Remove all cache on destroy
  willDestroy() {
    super.willDestroy?.();
    this._cache = {};
  }

  cache(query, results) {
    this._cache[safeKeyString(query)] = results;
    this._handleAction('onLoading', false);
    return results;
  }

  getCacheForQuery(query) {
    return this._cache[safeKeyString(query)];
  }

  removeFromCache(query) {
    delete this._cache[safeKeyString(query)];
  }

  removeAllFromCache() {
    this._cache = {};
  }

  clearResults() {
    this.results = [];
  }

  fetch(query) {
    console.log('fetch called with:', query);
    if (isBlank(query) || query.length < this.minQueryLength) {
      return;
    }
    let cachedValue = this.getCacheForQuery(query);
    console.log('cachedValue:', cachedValue);
    this._handleAction('onLoading', true);

    if (isPresent(cachedValue)) {
      this._handleAction('onLoading', false);
      return cachedValue;
    } else {
      console.log('No cache found, making request for:', query);
      return this.requestAndCache(query);
    }
  }

  async request(query) {
    // Native fetch as replacement for jQuery.ajax
    console.log('request called with:', query);
    let url = this.endpoint;
    let params = new URLSearchParams({ q: query });
    console.log('Request URL:', `${url}?${params}`);
    let response = await fetch(`${url}?${params}`, { method: 'GET' });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  }

  async requestAndCache(query) {
    try {
      let results = await this.request(query);
      console.log('requestAndCache results:', results);
      return this.cache(query, results);
    } catch (error) {
      return;
    }
  }

  @action
  async search(event) {
    console.log('search called with:', event);
    let query = event?.target?.value;
    let results = await this.fetch(query);
    if (results) {
      this._setResults(results);
    }
  }

  _setResults(results) {
    console.log('Setting results:', results);
    this._handleAction('onResults', results);
    this.args.handleResults?.(results);
    this.results = results;
  }

  // This replaces sendAction; expects closure actions passed as @onSelect, etc.
  _handleAction(actionName, ...args) {
    if (typeof this.args[actionName] === 'function') {
      this.args[actionName](...args);
    }
  }

  @action
  selectResult(result) {
    this._handleAction('onSelect', result);
  }
}
