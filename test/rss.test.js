/* jshint -W117 */
const config = {
  'loopback_url': 'http://test.test/',
  'rss': {
    'title': 'test rss',
    'description': 'description',
    'endpoint': '/rss',
    'length': 2
  },
};

const rss = require('../src/rss')(config);

test('empty rss', () => {
  const xml = rss.get({});
  expect(xml).toBe('<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0">' +
    '<title>test rss</title>' +
    '<description>description</description>' +
    '<link>http://test.test/</link>' +
    '<lastBuildDate>' + new Date().toString() + '</lastBuildDate>' +
    '<lastPubDate>' + new Date().toString() + '</lastPubDate>' +
    '<ttl>60</ttl>' +
    '</rss>');
});

test('1 item', () => {
  const data = {
    'a': {
      path: 'a',
      realPath: 'b',
      year: 2019,
      month: 5,
      day: 5,
      date: new Date(2019, 5, 5),
      title: 'Title with : info !',
      thumbnail: '/2019/05/05/thumbnail.jpg/',
      escapedTitle: 'title_with___info',
      url: '/2019/05/05/title_with___info/',
    }
  };
  const xml = rss.get(data);
  expect(xml).toEqual('<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0">' +
    '<title>test rss</title>' +
    '<description>description</description>' +
    '<link>http://test.test/</link>' +
    '<lastBuildDate>' + new Date().toString() + '</lastBuildDate>' +
    '<lastPubDate>' + new Date().toString() + '</lastPubDate>' +
    '<ttl>60</ttl>' +
    '<item>' +
    '<title>Title with : info !</title>' +
    '<link>http://test.test/2019/05/05/title_with___info/</link>' +
    '<pubDate>' + new Date(2019, 5, 5).toString() + '</pubDate>' +
    '</item>' +
    '</rss>');
});

test('3 items only 2 shown sorted', () => {
  const data = {
    'a': {
      path: '2019/05/05',
      date: new Date(2019, 5, 5),
      title: 'a',
      url: 'a',
    },
    'b': {
      path: '2018/05/05',
      date: new Date(2018, 5, 5),
      title: 'b',
      url: 'b',
    },
    'c': {
      path: '2020/05/05',
      date: new Date(2020, 5, 5),
      title: 'c',
      url: 'c',
    }
  };
  const xml = rss.get(data);
  expect(xml).toEqual('<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0">' +
    '<title>test rss</title>' +
    '<description>description</description>' +
    '<link>http://test.test/</link>' +
    '<lastBuildDate>' + new Date().toString() + '</lastBuildDate>' +
    '<lastPubDate>' + new Date().toString() + '</lastPubDate>' +
    '<ttl>60</ttl>' +
    '<item>' +
    '<title>c</title>' +
    '<link>http://test.test/c</link>' +
    '<pubDate>' + new Date(2020, 5, 5).toString() + '</pubDate>' +
    '</item>' +
    '<item>' +
    '<title>a</title>' +
    '<link>http://test.test/a</link>' +
    '<pubDate>' + new Date(2019, 5, 5).toString() + '</pubDate>' +
    '</item>' +
    '</rss>');
});