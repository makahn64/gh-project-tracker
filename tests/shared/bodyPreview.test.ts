import { bodyPreview } from '../../shared/bodyPreview';

test('strips markdown to plain text', () => {
  expect(bodyPreview('## Why\n\n`code` and **bold** [link](http://x)')).toBe('Why code and bold link');
});

test('null or empty body is empty string', () => {
  expect(bodyPreview(null)).toBe('');
  expect(bodyPreview('')).toBe('');
});

test('long body is cut to max with an ellipsis', () => {
  const r = bodyPreview('word '.repeat(40), 120);
  expect(r.length).toBeLessThanOrEqual(121);
  expect(r.endsWith('…')).toBe(true);
});

test('drops fenced code blocks, html comments and images', () => {
  expect(bodyPreview('Intro\n```ts\nconst x = 1;\n```\n<!-- hi -->![img](a.png) end')).toBe('Intro end');
});
