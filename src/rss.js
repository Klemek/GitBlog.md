const convert = require('xml-js');

const mapArticle = (url, article) => {
  return {
    'title': {'_text': article.title},
    'link': {'_text': (url + article.url).replace(/([^:])\/\//g, '$1/')},
    'pubDate': {'_text': article.date.toString()},
  };
};

module.exports = (config) => {
  return {
    get: (dict) => {
      const items = Object.values(dict)
        .sort((a, b) => ('' + b.path).localeCompare(a.path))
        .slice(0, config['rss']['length']);
      const data = {
        '_declaration': {
          '_attributes': {
            'version': '1.0',
            'encoding': 'UTF-8'
          }
        },
        'rss': {
          '_attributes': {
            'version': '2.0'
          },
          'title': {'_text': config['rss']['title']},
          'description': {'_text': config['rss']['description']},
          'link': {'_text': config['loopback_url']},
          'lastBuildDate': {'_text': new Date().toString()},
          'lastPubDate': {'_text': new Date().toString()},
          'ttl': {'_text': '60'},
          'item': items.map((a) => mapArticle(config['loopback_url'], a))
        }
      };
      return convert.js2xml(data, {compact: true});
    }
  };
};