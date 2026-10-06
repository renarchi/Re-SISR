'use strict';

// Run from the repository root: node --test tests/comparison.test.cjs
const assert = require('node:assert/strict');
const test = require('node:test');
const { buildCatalog, createCamera, createPairLoader } = require('../docs/comparison.js');

const models = [
  { id: 'marina', name: 'marina', src: 'marina.png', parameters: 15000, method: 'Restore + mpv default scaling' },
  { id: 'Upscale_CNN_x2_S', name: 'Anime4K_Upscale_CNN_x2_S', src: 'small.png', parameters: 3000, method: 'native x2' },
  ...Array.from({ length: 25 }, (_, i) => ({
    id: `shader_${i}`, name: `Shader ${i}`, src: `shader_${i}.png`, parameters: 'Unknown', method: 'native x2'
  }))
];
const fixture = { width: 1536, height: 1152, input: 'input.png', models };

test('catalog preserves all 27 IDs, selected metadata and defaults', () => {
  const data = buildCatalog(fixture);
  assert.equal(data.models.length, 27);
  assert.equal(data.models[1].id, 'Upscale_CNN_x2_S');
  assert.equal(data.models[1].name, 'Upscale_CNN_x2_S');
  assert.equal(data.models[0].method, 'Restore + mpv default scaling');
  assert.equal(data.models[0].parameters, 15000);
  assert.deepEqual(data.defaults, ['marina', 'Upscale_CNN_x2_S']);
});

test('invalid geometry and duplicate IDs fail before images load', () => {
  assert.throws(() => buildCatalog({ ...fixture, width: 0 }));
  assert.throws(() => buildCatalog({ ...fixture, models: [models[0], models[0]] }));
});

test('fit, 1:1 and bounded pan retain a shared image coordinate system', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(768, 576);
  assert.deepEqual(camera.getView(), { scale: 0.5, x: 0, y: 0 });
  camera.oneToOne();
  assert.deepEqual(camera.getView(), { scale: 1, x: -384, y: -288 });
  camera.pan(10000, -10000);
  assert.deepEqual(camera.getView(), { scale: 1, x: 0, y: -576 });
  camera.fit();
  assert.deepEqual(camera.getView(), { scale: 0.5, x: 0, y: 0 });
});

test('zoom anchors the inspected pixel and resizing preserves the center', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(768, 576);
  camera.zoom(2, 192, 144);
  assert.deepEqual(camera.getView(), { scale: 1, x: -192, y: -144 });
  camera.resize(640, 480);
  assert.deepEqual(camera.getView(), { scale: 1, x: -256, y: -192 });
  camera.fit();
  camera.resize(384, 288);
  assert.deepEqual(camera.getView(), { scale: 0.25, x: 0, y: 0 });
});

test('image loading requests only the selected pair and shares duplicate choices', async () => {
  const requests = [];
  const load = createPairLoader(async src => { requests.push(src); return { src }; });
  assert.deepEqual(requests, []);
  const pair = await load(models[0], models[1]);
  assert.deepEqual(requests, ['marina.png', 'small.png']);
  assert.equal(pair[1].src, 'small.png');
  requests.length = 0;
  await load(models[2], models[2]);
  assert.deepEqual(requests, ['shader_0.png']);
});

test('pair load rejects missing assets instead of displaying an incomplete comparison', async () => {
  const load = createPairLoader(async src => {
    if (src === 'small.png') throw Error('missing');
    return { src };
  });
  await assert.rejects(load(models[0], models[1]), /missing/);
});

test('zoom out cannot increase scale after a larger manual viewport resize', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(350, 330);
  camera.zoom(1.25);
  camera.resize(1118, 688);
  const before = camera.getView().scale;
  camera.zoom(0.8);
  assert.ok(camera.getView().scale <= before, 'zooming out must never increase scale');
});

test('manual resize immediately reconciles scale with the new fit minimum', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(350, 330);
  camera.zoom(1.25);
  camera.resize(1118, 688);
  assert.equal(camera.getView().scale, 43 / 72);
  assert.ok(Math.abs(camera.getView().x - 100.33333333333333) < 1e-10);
  assert.equal(camera.getView().y, 0);
});

test('1:1 in an odd viewport snaps translations to integer CSS pixels', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(349, 329);
  camera.oneToOne();
  assert.deepEqual(camera.getView(), { scale: 1, x: -593, y: -411 });
});

test('1:1 sets an exact unit scale even when reciprocal multiplication rounds down', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(296, 329);
  camera.oneToOne();
  assert.deepEqual(camera.getView(), { scale: 1, x: -620, y: -411 });
});

test('fractional panning at 1:1 stays pixel aligned and bounded', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(768, 576);
  camera.oneToOne();
  camera.pan(0.6, -0.6);
  assert.deepEqual(camera.getView(), { scale: 1, x: -383, y: -289 });
  camera.pan(-10000.5, 10000.5);
  assert.deepEqual(camera.getView(), { scale: 1, x: -768, y: 0 });
});

test('resize at 1:1 stays pixel aligned in odd crop and letterbox viewports', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(768, 576);
  camera.oneToOne();
  camera.resize(349, 329);
  assert.deepEqual(camera.getView(), { scale: 1, x: -593, y: -411 });
  camera.resize(1537, 1201);
  assert.deepEqual(camera.getView(), { scale: 1, x: 1, y: 25 });
});

test('fit at non-unit scale keeps exact fractional centering', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(349, 329);
  assert.deepEqual(camera.getView(), { scale: 349 / 1536, x: 0, y: 33.625 });
  camera.oneToOne();
  camera.fit();
  assert.deepEqual(camera.getView(), { scale: 349 / 1536, x: 0, y: 33.625 });
});

test('fit at unit scale also aligns an odd letterbox to whole pixels', () => {
  const camera = createCamera(1536, 1152);
  camera.resize(1536, 1201);
  assert.deepEqual(camera.getView(), { scale: 1, x: 0, y: 25 });
});
