import assert from 'node:assert/strict';
import { getValidCoordinates } from '../src/lib/maps/property-coordinates';
import { loadGoogleMapsScript, onGoogleMapsAuthFailure } from '../src/lib/maps/google-maps-loader';

async function run() {
  assert.deepEqual(getValidCoordinates({ latitude: 0, longitude: -3 }), { lat: 0, lng: -3 });
  assert.deepEqual(getValidCoordinates({
    latitude: 6, longitude: 3, coordinates: { lat: 10, lng: 20 },
  }), { lat: 6, lng: 3 });
  assert.equal(getValidCoordinates({ latitude: 6, coordinates: { lat: NaN, lng: 3 } }), null);
  assert.equal(getValidCoordinates({ latitude: 91, longitude: 3 }), null);
  assert.deepEqual(getValidCoordinates({ coordinates: { lat: 9, lng: 7 } }), { lat: 9, lng: 7 });

  const browser = {} as Window;
  const scripts: HTMLScriptElement[] = [];
  Object.assign(globalThis, {
    window: browser,
    document: {
      createElement: () => ({ remove() { scripts.splice(scripts.indexOf(this as unknown as HTMLScriptElement), 1); } }),
      head: { appendChild: (script: HTMLScriptElement) => scripts.push(script) },
    },
  });

  const failedAttempt = loadGoogleMapsScript('fixture');
  assert.equal(loadGoogleMapsScript('fixture'), failedAttempt);
  assert.equal(scripts.length, 1);
  scripts[0].onerror?.(new Event('error'));
  await assert.rejects(failedAttempt, /Failed to load/);
  assert.equal(scripts.length, 0);

  const retry = loadGoogleMapsScript('fixture');
  const callback = new URL(scripts[0].src).searchParams.get('callback');
  assert.equal(callback, '__propHuntaGoogleMapsReady');
  browser.google = { maps: { Map } };
  browser.__propHuntaGoogleMapsReady?.();
  assert.equal(await retry, browser.google.maps);

  let authFailures = 0;
  const unsubscribe = onGoogleMapsAuthFailure(() => { authFailures++; });
  browser.gm_authFailure?.();
  assert.equal(authFailures, 1);
  await assert.rejects(loadGoogleMapsScript('fixture'), /MAPS_AUTH_FAILURE/);
  unsubscribe();
  console.log('Map coordinates, shared loader, network retry, and authorization state passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
