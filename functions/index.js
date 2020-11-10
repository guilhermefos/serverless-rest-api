const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp(functions.config().firebase);

const faunadb = require("faunadb");
const q = faunadb.query;
const client = new faunadb.Client({
  secret: "fnAD55Ys3rACA7cdaVpBQ74NB5PdPThmYLyFnaUS",
});

const express = require("express");
const cors = require("cors");
const api = express();

api.use(cors({ origin: true }));

api.get("/api/v1/", (req, res) => {
  res
    .status(200)
    .send(`<img src="https://media.giphy.com/media/hhkflHMiOKqI/source.gif">`);
});

api.post("/api/v1/games", (req, res) => {
  let addGame = client.query(
    q.Create(q.Collection("games"), {
      data: {
        title: req.body.title,
        consoles: req.body.consoles,
        metacritic_score: req.body.metacritic_score,
        release_date: q.Date(req.body.release_date),
      },
    })
  );
  addGame
    .then((response) => {
      return res.status(200).send(`Saved! ${response.ref}`);
    })
    .catch((reason) => {
      res.error(reason);
    });
});

api.get("/api/v1/console/:name", (req, res) => {
  let findGamesForConsole = client.query(
    q.Map(
      q.Paginate(
        q.Match(q.Index("games_by_console"), req.params.name.toLowerCase())
      ),
      q.Lambda(["title", "ref"], q.Var("title"))
    )
  );
  findGamesForConsole
    .then((result) => {
      return res.status(200).send(result);
    })
    .catch((error) => {
      res.error(error);
    });
});

api.get("/api/v1/games", (req, res) => {
  let findGamesByName = client.query(
    q.Map(
      q.Paginate(
        q.Filter(
          q.Match(q.Index("games_by_title")),
          q.Lambda(
            ["title", "ref"],
            q.GT(
              q.FindStr(
                q.LowerCase(q.Var("title")),
                req.query.title.toLocaleLowerCase()
              ),
              -1
            )
          )
        )
      ),
      q.Lambda(["title", "ref"], q.Get(q.Var("ref")))
    )
  );
  findGamesByName
    .then((result) => {
      return res.status(200).send(result);
    })
    .catch((error) => {
      res.error(error);
    });
});

exports.api = functions.https.onRequest(api);
