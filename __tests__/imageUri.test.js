import {imageUri} from '../src/tools/imageUri';
import {WEB} from '../src/tools/constants';

describe('imageUri', () => {
  test('rend les URL d’avatar acceptables pour iOS', () => {
    expect(imageUri(null)).toBeNull();
    expect(imageUri('http://boongo7.com/a b.png')).toBe('https://boongo7.com/a%20b.png');
    expect(imageUri('//cdn.test/x.png')).toBe('https://cdn.test/x.png');
    expect(imageUri('/storage/x.png')).toBe(`${WEB.boongo_url}/storage/x.png`.replace(/^http:\/\//, 'https://'));
    expect(imageUri('https://boongo7.com/a%20b.png')).toBe('https://boongo7.com/a%20b.png');
  });
});
