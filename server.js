var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");

var PORT = 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
// mongoose.connect("mongodb://localhost/news-scraper-db", { useNewUrlParser: true });

app.get("/scrape", function(req, res) {
  axios.get("http://old.reddit.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $("p.title").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .children()
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
        
      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({}, function(error, found) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(found);
    }
  });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({
    _id: req.params.id
  }, function(error, found) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(found);
    }
  })
  .populate("note")
  .then(function (found) {
    res.json(found);
  })
  .catch(function (err) {
    res.json(err);
  });

});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
