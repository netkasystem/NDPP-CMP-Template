const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const templatePath = path.join(__dirname, '..', 'template.tpl');
const template = fs.readFileSync(templatePath, 'utf8');
const match = template.match(
  /___SANDBOXED_JS_FOR_WEB_TEMPLATE___\s*([\s\S]*?)\s*___WEB_PERMISSIONS___/
);

assert.ok(match, 'sandboxed JavaScript section must exist');
const sandboxedSource = match[1];

const plain = value => JSON.parse(JSON.stringify(value));

function runTemplate(overrides = {}, options = {}) {
  const calls = [];
  const windows = Object.create(null);
  const cookieValues = options.cookieValues || [];
  const permission = options.permission || (() => true);

  const record = (name, implementation) => (...args) => {
    calls.push({ name, args: plain(args) });
    return implementation ? implementation(...args) : undefined;
  };

  const apis = {
    logToConsole: record('logToConsole'),
    setDefaultConsentState: record('setDefaultConsentState'),
    updateConsentState: record('updateConsentState'),
    getCookieValues: record('getCookieValues', name => (
      name === 'cconsent' ? cookieValues : []
    )),
    setInWindow: record('setInWindow', (name, value) => {
      windows[name] = value;
    }),
    // Stand in for GTM's sandboxed JSON API, which returns undefined for
    // malformed input rather than throwing — the template relies on that,
    // because sandboxed JavaScript cannot use try/catch.
    JSON: {
      stringify: (v) => JSON.stringify(v),
      parse: (text) => {
        try {
          return JSON.parse(text);
        } catch (e) {
          return undefined;
        }
      }
    },
    queryPermission: record('queryPermission', permission),
    gtagSet: record('gtagSet'),
    encodeUriComponent: encodeURIComponent,
    injectScript: record('injectScript', (url, onSuccess, onFailure) => {
      if (options.injectScript) {
        options.injectScript(url, onSuccess, onFailure, calls);
      } else {
        onSuccess();
      }
    })
  };

  const data = {
    apiURL: 'https://ndppdev.netkasystem.co.th/api/cookie/cookiesetting.js',
    apiKey: 'runtime-test-key',
    enableConsentMode: true,
    waitForUpdate: '500',
    defaultSettings: [],
    enableAutoBlock: false,
    gtmOnSuccess: record('gtmOnSuccess'),
    gtmOnFailure: record('gtmOnFailure'),
    ...overrides
  };

  vm.runInNewContext(sandboxedSource, {
    data,
    require(name) {
      assert.ok(apis[name], `unexpected sandbox API: ${name}`);
      return apis[name];
    }
  }, { filename: templatePath });

  return {
    calls,
    windows,
    callsFor(name) {
      return calls.filter(call => call.name === name);
    }
  };
}

const deniedDefault = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500
};

test('sets the registered CMP developer ID and a fail-closed global default', () => {
  const runtime = runTemplate();

  assert.deepEqual(runtime.callsFor('gtagSet')[0].args, ['developer_id.dYmE5Zm', true]);
  assert.deepEqual(runtime.callsFor('setDefaultConsentState')[0].args[0], deniedDefault);
  assert.equal(runtime.callsFor('gtmOnSuccess').length, 1);
  assert.equal(runtime.callsFor('gtmOnFailure').length, 0);
});

test('applies global measurement and a more-specific regional denial', () => {
  const runtime = runTemplate({
    defaultSettings: [
      {
        region: '',
        granted: 'ad_storage, analytics_storage, ad_user_data, ad_personalization',
        denied: ''
      },
      {
        region: 'de, FR',
        granted: '',
        denied: 'ad_storage, analytics_storage, ad_user_data, ad_personalization'
      }
    ]
  });

  const defaults = runtime.callsFor('setDefaultConsentState').map(call => call.args[0]);
  assert.equal(defaults.length, 2);
  assert.equal(defaults[0].analytics_storage, 'granted');
  assert.equal(defaults[0].ad_user_data, 'granted');
  assert.deepEqual(defaults[1].region, ['DE', 'FR']);
  assert.equal(defaults[1].analytics_storage, 'denied');
});

test('invalid regional rows and timeout values fall back to global denied', () => {
  const runtime = runTemplate({
    waitForUpdate: 'not-a-number',
    defaultSettings: [{
      region: 'EEA',
      granted: 'ad_storage,analytics_storage,unknown_storage',
      denied: ''
    }]
  });

  assert.deepEqual(runtime.callsFor('setDefaultConsentState')[0].args[0], deniedDefault);
});

test('regional-only configuration receives an explicit denied global fallback', () => {
  const runtime = runTemplate({
    waitForUpdate: '1',
    defaultSettings: [{
      region: 'US-CA',
      granted: 'analytics_storage',
      denied: ''
    }]
  });
  const defaults = runtime.callsFor('setDefaultConsentState').map(call => call.args[0]);

  assert.equal(defaults.length, 2);
  assert.deepEqual(defaults[0], deniedDefault);
  assert.deepEqual(defaults[1].region, ['US-CA']);
  assert.equal(defaults[1].analytics_storage, 'granted');
  assert.equal(defaults[1].wait_for_update, 500);
});

test('duplicate region rows make the entire default configuration fail closed', () => {
  const runtime = runTemplate({
    defaultSettings: [
      { region: 'DE,FR', granted: 'analytics_storage', denied: '' },
      { region: 'FR', granted: 'ad_storage', denied: '' }
    ]
  });

  assert.equal(runtime.callsFor('setDefaultConsentState').length, 1);
  assert.deepEqual(runtime.callsFor('setDefaultConsentState')[0].args[0], deniedDefault);
});

test('restores decoded granular consent through updateConsentState', () => {
  const record = JSON.stringify({
    categories: {
      Necessary: { wanted: true },
      Performance: { wanted: true },
      Functional: { wanted: true },
      Targeting: { wanted: false }
    }
  });
  const runtime = runTemplate({}, { cookieValues: [record] });

  assert.deepEqual(runtime.callsFor('updateConsentState')[0].args[0], {
    ad_storage: 'denied',
    analytics_storage: 'granted',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'denied',
    security_storage: 'granted'
  });
});

test('malformed stored consent never produces a consent update', () => {
  const runtime = runTemplate({}, { cookieValues: ['%broken-json'] });

  assert.equal(runtime.callsFor('updateConsentState').length, 0);
  assert.equal(runtime.callsFor('setDefaultConsentState').length, 1);
  assert.deepEqual(runtime.callsFor('setDefaultConsentState')[0].args[0], deniedDefault);
});

test('SocialMedia alone does not grant Google advertising consent', () => {
  const record = JSON.stringify({
    categories: {
      Necessary: { wanted: true },
      SocialMedia: { wanted: true },
      Targeting: { wanted: false }
    }
  });
  const runtime = runTemplate({}, { cookieValues: [record] });
  const update = runtime.callsFor('updateConsentState')[0].args[0];

  assert.equal(update.ad_storage, 'denied');
  assert.equal(update.ad_user_data, 'denied');
  assert.equal(update.ad_personalization, 'denied');
});

test('installs the live consent bridge before injecting the CMP', () => {
  const runtime = runTemplate();
  const bridgeCall = runtime.calls.findIndex(call => (
    call.name === 'setInWindow' && call.args[0] === 'nksGtmConsentUpdate'
  ));
  const injection = runtime.calls.findIndex(call => call.name === 'injectScript');

  assert.ok(bridgeCall >= 0);
  assert.ok(injection > bridgeCall);

  runtime.windows.nksGtmConsentUpdate({
    ad_storage: 'granted',
    analytics_storage: 'denied',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    functionality_storage: 'denied',
    personalization_storage: 'granted',
    security_storage: 'granted'
  });
  assert.equal(runtime.callsFor('updateConsentState').length, 1);
});

test('live bridge drops unknown keys and denies omitted optional consent types', () => {
  const runtime = runTemplate();

  runtime.windows.nksGtmConsentUpdate({
    ad_storage: 'granted',
    unknown_storage: 'granted'
  });
  const update = runtime.callsFor('updateConsentState')[0].args[0];

  assert.deepEqual(update, {
    ad_storage: 'granted',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted'
  });
  assert.equal(Object.hasOwn(update, 'unknown_storage'), false);
});

test('denied CMP injection permission fails without attempting injection', () => {
  const runtime = runTemplate({}, {
    permission: (permissionName) => permissionName !== 'inject_script'
  });

  assert.equal(runtime.callsFor('injectScript').length, 0);
  assert.equal(runtime.callsFor('gtmOnFailure').length, 1);
  assert.equal(runtime.callsFor('gtmOnSuccess').length, 0);
});

test('missing API key fails before requesting script permission', () => {
  const runtime = runTemplate({ apiKey: '' });

  assert.equal(runtime.callsFor('injectScript').length, 0);
  assert.equal(runtime.callsFor('gtmOnFailure').length, 1);
  assert.equal(runtime.callsFor('gtmOnSuccess').length, 0);
});

test('API key is encoded before constructing the permitted script URL', () => {
  const runtime = runTemplate({ apiKey: 'tenant key&mode=test' });
  const url = runtime.callsFor('injectScript')[0].args[0];

  assert.equal(
    url,
    'https://ndppdev.netkasystem.co.th/api/cookie/cookiesetting.js/?key=tenant%20key%26mode%3Dtest'
  );
});

test('contradictory async callbacks complete the GTM tag exactly once', () => {
  const runtime = runTemplate({}, {
    injectScript(url, onSuccess, onFailure) {
      onFailure();
      onSuccess();
    }
  });

  assert.equal(runtime.callsFor('gtmOnFailure').length, 1);
  assert.equal(runtime.callsFor('gtmOnSuccess').length, 0);
});

test('AutoBlock loads serially before the CMP and preserves GTM defaults', () => {
  const injected = [];
  const runtime = runTemplate({ enableAutoBlock: true }, {
    injectScript(url, onSuccess) {
      injected.push(url);
      onSuccess();
    }
  });

  assert.equal(injected.length, 2);
  assert.equal(injected[0], 'https://cookiebanner.pdpanetka.com/nksAutoBlock.min.js');
  assert.match(injected[1], /^https:\/\/ndppdev\.netkasystem\.co\.th\//);
  assert.deepEqual(
    runtime.callsFor('setInWindow').find(call => call.args[0] === '__nksCmpDefaultSet').args,
    ['__nksCmpDefaultSet', true, true]
  );
  assert.equal(runtime.callsFor('gtmOnSuccess').length, 1);
});

test('AutoBlock failure stops CMP injection and reports only failure', () => {
  const injected = [];
  const runtime = runTemplate({ enableAutoBlock: true }, {
    injectScript(url, onSuccess, onFailure) {
      injected.push(url);
      onFailure();
    }
  });

  assert.deepEqual(injected, ['https://cookiebanner.pdpanetka.com/nksAutoBlock.min.js']);
  assert.equal(runtime.callsFor('gtmOnFailure').length, 1);
  assert.equal(runtime.callsFor('gtmOnSuccess').length, 0);
});

test('Consent Mode can be disabled without suppressing CMP loading', () => {
  const runtime = runTemplate({ enableConsentMode: false });

  assert.equal(runtime.callsFor('setDefaultConsentState').length, 0);
  assert.equal(runtime.callsFor('updateConsentState').length, 0);
  assert.equal(runtime.callsFor('setInWindow').length, 0);
  assert.equal(runtime.callsFor('injectScript').length, 1);
  assert.equal(runtime.callsFor('gtmOnSuccess').length, 1);
});
