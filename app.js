import bodyParser from "body-parser";
import { randomBytes } from "crypto";
import express from "express";
import session from "express-session";
import morgan from "morgan";

const app = express();
app.use(morgan("combined"));
app.use(bodyParser.urlencoded({ extended: false }));

const users = [{ klinux: "123" }, { root: "toor" }, { test: "test" }];
// can be thought of as a database

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
// this session holds users session
// got 60 second expire time
// if sessin time was expired then all operations inactive

app.get("/", (_, res) => {
        res.send("welcome, pls go auth for login");
});

app.use("/auth", authSession); // authSession actively using here
app.use("/auth", (req, res, next) => {
        // middleware for check users session is created
        if (!req.session.authID) {
                next();
        } else {
                res.send("You are already loged in.");
        }
});
app.post("/auth/", (req, res) => {
        // if user data is correct then create a session for user
        if (users.find((_) => req.body.username)[req.body.username] === req.body.password) {
                req.session.authID = randomBytes(8).toString("hex");
                req.session.usernInfo = [req.body.username, req.session.authID];
                // res.send({ auth: req.session.usernInfo });
                res.send().status(200);
        } else {
                res.send("Auth error").status(404);
        }
});

app.use("/status", authSession); // need session for use this url
app.use("/status", (req, res, next) => {
        if (req.session.authID) {
                next();
        } else {
                // if session was not created then send 401
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
