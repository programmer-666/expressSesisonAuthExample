import bodyParser from "body-parser";
import { randomBytes } from "crypto";
import express from "express";
import session from "express-session";
import morgan from "morgan";

const app = express();
app.use(morgan("common"));
app.use(bodyParser.urlencoded({ extended: false }));

const users = [{ klinux: "123" }, { root: "toor" }, { test: "test" }];

const authSession = session({
  secret: "verysecret",
  saveUninitialized: true,
  resave: false,
  cookie: {
    maxAge: 60 * 1000,
    secure: false,
    httpOnly: true,
  },
});

app.get("/", (_, res) => {
  res.send("welcome, pls go auth for login").status(200);
});

app.use("/auth", authSession);
app.use("/auth", (req, res, next) => {
  if (!req.session.authID) {
    next();
  } else {
    res.send("You are already loged in.");
  }
});
app.post("/auth/", (req, res) => {
  if (users.find((user) => req.body.username)[req.body.username] === req.body.password) {
    req.session.authID = randomBytes(8).toString("hex");
    req.session.usernInfo = [req.body.username, req.session.authID];
    res.send({ auth: req.session.usernInfo });
  }
});

app.use("/status", authSession);
app.use("/status", (req, res, next) => {
  if (req.session.authID) {
    next();
  } else {
    res.send("Unauthorized").status(401);
  }
});
app.get("/status", (req, res) => {
  res.send({ session: req.session.authID });
});

app.use("/whoami", authSession);
app.use("/whoami", (req, res, next) => {
  if (req.session.authID) {
    next();
  } else {
    res.send("Unauthorized").status(401);
  }
});
app.get("/whoami", (req, res) => {
  res.send(req.session.usernInfo[0]); // 0 is username
});

app.listen(80);

/* usage
curl -X POST http://localhost/auth \
-c memory -d 'username=klinux&password=123' \
-H "Content-Type: application/x-www-form-urlencoded" \
--next -X GET -c memory http://localhost/status
*/
