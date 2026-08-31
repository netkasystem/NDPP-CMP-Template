// Run the scenarios embedded in template.tpl the way the GTM Template Editor
// runs them, so they cannot rot between one manual editor session and the next.
//
// The editor is the authoritative place to run these — it compiles against the
// real sandbox — but a scenario that fails here will fail there too, and this
// tells us before someone opens a browser.
//
//   node test/embedded-scenarios.test.js
//
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const templatePath = path.join(__dirname, '..', 'template.tpl');
const template = fs.readFileSync(templatePath, 'utf8');

const jsMatch = template.match(
  /___SANDBOXED_JS_FOR_WEB_TEMPLATE___\s*([\s\S]*?)\s*___WEB_PERMISSIONS___/
);
assert.ok(jsMatch, 'sandboxed JavaScript section must exist');
const sandboxedSource = jsMatch[1];

const testsMatch = template.match(/___TESTS___\s*([\s\S]*?)\s*___NOTES___/);
assert.ok(testsMatch, 'tests section must exist');

/** Parse the `scenarios:` list. Each entry is `- name:` plus a `code: |-` block. */
function parseScenarios(block) {
  const lines = block.split('\n');
  const scenarios = [];
  let current = null;
  let collecting = false;
  let indent = 0;

  for (const line of lines) {
    const nameMatch = /^-\s+name:\s*(.+)$/.exec(line);
    if (nameMatch) {
      if (current) scenarios.push(current);
      current = { name: nameMatch[1].trim(), code: [] };
      collecting = false;
      continue;
    }
    if (!current) continue;

    if (/^\s+code:\s*\|-?\s*$/.test(line)) {
      collecting = true;
      indent = 0;
      continue;
    }
    if (collecting) {
      if (line.trim() === '') { current.code.push(''); continue; }
      if (!indent) indent = line.length - line.trimStart().length;
      current.code.push(line.slice(indent));
    }
  }
  if (current) scenarios.push(current);
  return scenarios.map(s => ({ name: s.name, code: s.code.join('\n') }));
}

const scenarios = parseScenarios(testsMatch[1]);

function runScenario(code) {
  const calls = [];
  const overrides = Object.create(null);
  const windows = Object.create(null);

  const record = (name, implementation) => (...args) => {
    calls.push({ name, args });
    const impl = overrides[name] || implementation;
    return impl ? impl(...args) : undefined;
  };

  const apis = {
    logToConsole: record('logToConsole'),
    setDefaultConsentState: record('setDefaultConsentState'),
    updateConsentState: record('updateConsentState'),
    getCookieValues: record('getCookieValues', () => []),
    setInWindow: record('setInWindow', (name, value) => { windows[name] = value; }),
    queryPermission: record('queryPermission', () => true),
    gtagSet: record('gtagSet'),
    encodeUriComponent: encodeURIComponent,
    callInWindow: record('callInWindow'),
    copyFromWindow: record('copyFromWindow', name => windows[name]),
    callLater: record('callLater', fn => fn()),
    Object: Object,
    // GTM's sandboxed JSON returns undefined for malformed input; it never throws.
    JSON: {
      stringify: v => JSON.stringify(v),
      parse: (text) => { try { return JSON.parse(text); } catch (e) { return undefined; } }
    },
    injectScript: record('injectScript', (url, onSuccess) => { if (onSuccess) onSuccess(); })
  };

  const failures = [];

  const api = {
    mock(name, implementation) {
      overrides[name] = typeof implementation === 'function'
        ? implementation
        : () => implementation;
    },
    runCode(data) {
      const merged = {
        gtmOnSuccess: record('gtmOnSuccess'),
        gtmOnFailure: record('gtmOnFailure'),
        ...data
      };
      vm.runInNewContext(sandboxedSource, {
        data: merged,
        require(name) {
          if (!apis[name]) throw new Error('unexpected sandbox API: ' + name);
          return apis[name];
        }
      }, { filename: templatePath });
    },
    assertApi(name) {
      const callsFor = () => calls.filter(c => c.name === name);
      return {
        wasCalled() {
          if (!callsFor().length) failures.push(`${name} was expected to be called`);
        },
        wasNotCalled() {
          if (callsFor().length) failures.push(`${name} was not expected to be called`);
        },
        wasCalledWith(...expected) {
          // The scenario and the template run in separate VM contexts, so their
          // object literals have different prototypes. Compare by value.
          const norm = v => JSON.parse(JSON.stringify(v === undefined ? null : v));
          const want = norm(expected);
          const hit = callsFor().some(c => {
            try {
              assert.deepStrictEqual(norm(c.args.slice(0, expected.length)), want);
              return true;
            } catch (e) { return false; }
          });
          if (!hit) {
            failures.push(
              `${name} was not called with ${JSON.stringify(expected)}; ` +
              `calls: ${JSON.stringify(callsFor().map(c => c.args))}`
            );
          }
        }
      };
    },
    fail(message) { failures.push(String(message)); }
  };

  vm.runInNewContext(code, api, { filename: 'scenario' });
  return failures;
}

test('template.tpl embeds the scenarios the Template Editor runs', () => {
  assert.ok(scenarios.length >= 12, `expected at least 12 scenarios, found ${scenarios.length}`);
  for (const s of scenarios) assert.ok(s.code.trim().length, `scenario "${s.name}" has no code`);
});

for (const scenario of scenarios) {
  test(`editor scenario: ${scenario.name}`, () => {
    const failures = runScenario(scenario.code);
    assert.deepEqual(failures, [], failures.join('\n'));
  });
}
