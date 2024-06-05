import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { randomBytes } from "crypto";
import csurf from "csurf";
import express from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import morgan from "morgan";

const app = express();

// Logging middleware for request details
app.use(morgan("combined"));

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware to parse cookies
app.use(cookieParser());

// Middleware for CSRF protection using cookies
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Rate limiting middleware to prevent brute-force attacks
const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 login requests per windowMs
        message: "Too many login attempts from this IP, please try again after 15 minutes",
});

// Simulate a database with hashed passwords
const users = [
        { username: "klinix", password: bcrypt.hashSync("123", 12) },
        { username: "root", password: bcrypt.hashSync("toor", 12) },
        { username: "test", password: bcrypt.hashSync("test", 12) },
];

// Session configuration for user authentication
const authSession = session({
        secret: "verysecret", // Secret used to sign the session ID cookie
        saveUninitialized: false, // Do not save uninitialized sessions
        resave: false, // Do not save session if unmodified
        cookie: {
                maxAge: 60 * 1000, // Session expires after 1 minute
                secure: false, // Set to true if using HTTPS
                httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
                sameSite: "strict", // Ensures the cookie is only sent to the same site
        },
});

app.use(authSession);

// Root route serving the login form with CSRF token
app.get("/", csrfProtection, (req, res) => {
        res.send(`welcome, pls login <br><form action="/auth" method="POST">
        <input type="text" name="username" placeholder="Username">
        <input type="password" name="password" placeholder="Password">
        <input type="hidden" name="_csrf" value="${req.csrfToken()}">
        <button type="submit">Login</button>
    </form>`);
});

// Middleware to check if the user is already logged in
app.use("/auth", (req, res, next) => {
        if (req.session.authID) {
                res.send("You are already logged in.");
        } else {
                next();
        }
});

// Route to handle login authentication
app.post("/auth", loginLimiter, csrfProtection, async (req, res) => {
        // Find the user in the simulated database
        const user = users.find((u) => u.username === req.body.username);

        // Check if the user exists and the password is correct
        if (user && (await bcrypt.compare(req.body.password, user.password))) {
                req.session.authID = randomBytes(8).toString("hex"); // Create a session ID
                req.session.usernInfo = [req.body.username, req.session.authID]; // Store user info in session
                res.status(200).send("Login successful");
        } else {
                res.status(401).send("Auth error"); // Authentication failed
        }
});

// Middleware to ensure the user is authenticated
const authMiddleware = (req, res, next) => {
        if (req.session.authID) {
                next(); // Proceed if authenticated
        } else {
                res.status(401).send("Unauthorized"); // Deny access if not authenticated
        }
};

// Route to check the session status
app.use("/status", authMiddleware);
app.get("/status", (req, res) => {
        res.send({ session: req.session.authID });
});

// Route to get the authenticated user's information
app.use("/whoami", authMiddleware);
app.get("/whoami", (req, res) => {
        res.send(req.session.usernInfo[0]); // Respond with the username
});

// Start the server on port 80
app.listen(80, () => {
        console.log("Server is running on port 80");
});
