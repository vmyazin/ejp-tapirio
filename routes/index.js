const cors = require("cors");
const express = require("express");
const router = express.Router();
router.blogPath = __dirname + "/../content/articles/";
const Project = require("../scripts/app.functions");
const project = new Project(router.blogPath, {
  podcastFeedXml: __dirname + "/../public/ejp-podcast-feed.xml",
});
const { parse } = require("node-html-parser");

const moment = require("moment");
require("moment/locale/ru");

// default hero image
const defaultImage = "/images/bg-default.jpg";

let projectInfo = project.info;
let podcast = {},
  episodes = {};

let dateObj = new Date();
let current = {};
current.year = dateObj.getFullYear();
projectInfo["currentYear"] = current.year;

project.init().then(() => {
  project.sortBy({ property: "date", asc: false });

  podcast = project.podcastModule.json.rss;
  episodes = podcast.channel.item.map((episode) => {
    let episodeNumber = episode.title.split(":")[0];
    // add clean episode number to object
    episode.episodeNum = episodeNumber.replace("#", "");
    // add clean episode title
    episode.title = episode.title.replace(episodeNumber + ": ", "");
    episode.pubDateConverted = moment(episode.pubDate)
      .locale("en")
      .format("LL");

    if (projectInfo.podcast.useContentEncoded) {
      episode.description = episode['content:encoded'];
    }

    // get first available image for sharing
    const root = parse(episode.description);
    img = root.querySelector("img");
    if (img !== null) {
      const url = img.getAttribute("src");
      episode.shareImg = url;
    }

    return episode;
  });
});

router.get("/", (req, res) => {
  const articles = project.posts;
  res.render("index", {
    podcast,
    articles,
    projectInfo,
    isHeroParallax: false,
    path: "home"
  });
});

router.get("/about", (req, res) => {
  res.render("about", {
    projectInfo,
    path: req.path,
    pageTitle: "О нас",
    isHeroParallax: true,
    // heroImg: "/images/bg-techlife-kamas.jpg",
    pageDescription:
      "About the podcast and the author Vasily Myazin",
  });
});

router.get("/resources", (req, res) => {
  res.render("resources", {
    projectInfo,
    path: req.path,
    isHeroParallax: true,
    pageTitle: "Ресурсы",
    pageDescription:
      "Дополнительные материалы в качестве приложения к подкасту; статьи, картинки, ссылки и т. п.",
  });
});

router.route("/api/episode/:id").get(cors(), async (req, res) => {
  if (req.params.id) {
    result = episodes.find((obj) => {
      return obj.episodeNum === req.params.id;
    });
  } else {
    result = [];
  }
  res.json(result);
});

router.get("/episodes/:id", async (req, res) => {
  const slug = req.params.id;

  if (slug) {
    const i = episodes.findIndex((obj) => obj.episodeNum === slug);
    const episode = episodes[i];
    const nextEpisode = episodes[i + 1];
    const prevEpisode = episodes[i - 1];

    if (episode) {
      res.render(
        "episode",
        Object.assign(
          {},
          { projectInfo },
          {
            episode,
            nextEpisode,
            prevEpisode,
            path: req.path,
            isEpisodePage: true,
            isHeroParallax: true,
            heroImg: defaultImage,
            layout: "episode",
          }
        )
      );
      return;
    }
  }
  res.render("error rendering");
});

router.get("/tags", async (req, res) => {
  const tags = project.tags;
  res.render("tags", {
    tags,
    isHeroParallax: true,
    heroImg: defaultImage,
    projectInfo,
    path: req.path,
  });
});

router.get("/tags/:tag", async (req, res) => {
  const tag = req.params.tag;
  const tags = project.tags;
  const articles = await project.getPostsByTag(tag);
  res.render("tag", {
    tag,
    tags,
    isHeroParallax: true,
    heroImg: defaultImage,
    articles,
    projectInfo,
    path: req.path,
  });
});

router.get("/blog", async (req, res) => {
  const articles = project.posts;
  res.render("blog", {
    articles,
    projectInfo,
    isHeroParallax: true,
    heroImg: defaultImage,
    path: req.path,
  });
});

router.route("/api/search").get(cors(), async (req, res) => {
  const articles = project.posts;
  const search = req.query.name.toLowerCase();

  if (search) {
    results = articles.filter((a) =>
      (a.title + a.description + a.author).toLowerCase().includes(search)
    );
  } else {
    results = [];
  }
  res.json(results);
});

router.get("/blog/:filename", async (req, res) => {
  const slug = req.params.filename;
  const postMetaData = project.getPostMetadata(slug);

  if (!postMetaData) {
    res.render("blog-not-found", slug);
    return;
  }

  res.render(
    "article",
    Object.assign(
      {},
      { postMetaData },
      { projectInfo },
      {
        content: await project.renderMarkdown(slug),
        path: req.path,
        layout: "blog",
        isHeroParallax: true,
        heroImg: defaultImage,
        isBlog: true,
        isBlogPost: true,
      }
    )
  );
});

module.exports = router;
