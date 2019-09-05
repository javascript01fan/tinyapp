const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const uuid = require("uuid/v4");
const cookieSession = require("cookie-session");
const PORT = 4000; //default port
const { addUser, usersDB, authenticateUser, filterUser } = require("./helpers");
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    keys: [
      "e1d50c4f-538a-4682-89f4-c002f10a59c8",
      "2d310699-67d3-4b26-a3a4-1dbf2b67be5c"
    ]
  })
);

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "ed94f936" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
//Login user
app.get("/login", (req, res) => {
  let templateVars = { user: usersDB[req.session.user_id] }; //  to read the value * req.session.user_id *
  res.render("login", templateVars);
});
//Authentica login user
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = authenticateUser(email, password);
  if (user) {
    //res.cookie("user_id", user.id);
    req.session.user_id = user.id;
    // redirect to /quotes
    res.redirect("/urls");
  } else {
    res.status(403).send("Email cannot be found");
  }
}); //logout
app.post("/logout", (req, res) => {
  //res.clearCookie("user_id");
  req.session = null;
  return res.status(200).redirect("/login");
});
//Register new user
app.get("/register", (req, res) => {
  let templateVars = { user: usersDB[req.session.user_id] };
  res.render("register", templateVars);
});

//Register POST handler
app.post("/register", (req, res) => {
  //create const for email password
  const { email, password } = req.body;
  console.log("email password", email, password);
  if (authenticateUser(email)) {
    res.status(403).send("Email already in database");
    console.log(email);
  } else {
    //bcryting the passwords with salt
    const salt = bcrypt.genSaltSync(10);

    //hashed password
    const hashedPassword = bcrypt.hashSync(password, salt);

    //user const with email and hashed password
    const user = addUser(email, hashedPassword);
    console.log("user->", user);
    req.session.user_id = user;
    console.log("userDB ", usersDB);
    let templateVars = usersDB[user];
    res.redirect("urls");
  }
});
//Get usersJSON
app.get("/users", (req, res) => {
  res.json(usersDB);
});
app.get("/urls", (req, res) => {
  let templateVaars = {
    urls: filterUser(req.session.user_id, urlDatabase),
    user: usersDB[req.session.user_id]
  };
  console.log(filterUser(req.session.user_id, urlDatabase));

  res.render("urls_index", templateVaars);
});
app.get("/urls/new", (req, res) => {
  let templateVaars = { urls: urlDatabase, user: usersDB[req.session.user_id] };

  if (!req.session.user_id) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVaars);
});
app.get("/urls/:shortURL", (req, res) => {
  console.log(req.params.shortURL);
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: usersDB[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const userID = req.session.user_id;
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: userID };
  //--------------------------------------------------------------------------------
  console.log(req.body);

  //// Log the POST req body to the console
  // Respond with 'Ok' (we will replace this)
  res.redirect("/urls");
});
//Updating short urls
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});
//Deleting short urls
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

const generateRandomString = () => {
  return Math.random()
    .toString(36)
    .substring(7);
};

app.listen(PORT, () => {
  console.log(`Listening on port:${PORT}`);
});
