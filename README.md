# GitBlog.md (WIP)
> This is a work in progress, some information written here might not be true yet.

A static blog using Markdown pulled from your git repository.

## Flow

![root](./uml/root.png)

![article](./uml/article.png)

![webhook](./uml/webhook.png)

![rss](./uml/rss.png)

## Installation
**1. Download the latest version from the repo**
```bash
git clone https://github.com/klemek/gitblog.md.git
```
**2. Create your config file**
```bash
cd gitblog.md
cp config.example.json config.json
```
then edit the config.json file with your values :
> default values for config.json
````json
{
  "node_port": 3000,
  "data_dir": "data",
  "modules" : {
      "plantuml" : true,
      "rss": true,
      "webhook": true
    },
  "home" : {
    "index" : "index.ejs"
  },
  "article" : {
    "index" : "index.md"
  },
  "rss" : {
   "endpoint" : "/rss",
    "length" : 10
  },
  "webhook" : {
    "endpoint": "/webhook",
    "secret_file": "git_secret"
  }
}
````
**3. Create and init your git source**

You need to [create a new repository](https://github.com/new) on your favorite Git service.

```bash
#gitblog.md/
cd data
git remote add origin <url_of_your_repo.git>
git push -u origin master
```

**4. Refresh content with a webhook (optional)**

At first start, a `git_secret` file will be generated, use it to create a new webhook as following :

* Payload URL : `https://<url_of_your_server>/webhook`
* Content type : `application/json`
* Secret : `<content of the git_secret file>`
* Events : Just the push event

On GitHub, webhooks can be created in the `Settings/Webhooks` part of the repository.