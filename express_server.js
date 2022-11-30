const { application } = require("express");
const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Random 6 char string generator for ids
const generateRandomString = () => {

  const charString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  
  // Max of 6 random chars
  for (let i = 1; i <= 6; i++) {
    let randomChar = charString.charAt(Math.floor(Math.random() * charString.length));
    randomString += randomChar;
  }
  
  return randomString;
}

// Helper function for looking up users by email address
const getUserByEmail = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return null;
}

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
  const templateVars = { 
    urls: urlDatabase,
    // username: req.cookies["username"],
    user: users[specificUser]
  };
  res.render('urls_index', templateVars);
  console.log(templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  // console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
  const templateVars = { 
    // username: req.cookies["username"],
    user: users[specificUser]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
  const templateVars = { 
    // username: req.cookies["username"],
    user: users[specificUser]
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
  const templateVars = { 
    // username: req.cookies["username"],
    user: users[specificUser]
  };
  res.render("urls_login", templateVars);
});

app.get("/urls/:id", (req, res) => {
  // console.log(req.params);
  // console.log(urlDatabase);
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    // username: req.cookies["username"],
    user: users[specificUser]
  };
  res.render('urls_show', templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  // console.log(longURL);
  res.redirect(longURL);
});

// Route for deleting a URL
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

// Route for editing a URL
app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.editedURL;
  urlDatabase[id] = longURL;
  res.redirect('/urls');
});

// Route for logins
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  // console.log(username);
  res.redirect('/urls');
});

// Route for logouts
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// Route for register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) {
    return res.status(400).send('Please enter a valid email.')
  };

  if (!password) {
    return res.status(400).send('Please enter a valid password.')
  };

  if (getUserByEmail(email))
      return res.status(400).send('Email already in use.');

  let userID = generateRandomString();
  users[userID] = { 
      id: userID,
      email: email,
      password: password
  };
  res.cookie('user_id', userID);
  res.redirect('/urls');
  console.log(users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});