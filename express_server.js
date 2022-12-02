const { application } = require("express");
const { getUserByEmail } = require("./helpers");
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080


//*** Middleware ***//

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));


//*** Define databases ***//

const urlDatabase = {};
const users = {};


//*** Functions ***//

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
};

// Returns URLs that match user ID
const urlsForUser = (id) => {
  const userURLs = {};

  for (let urls in urlDatabase) {
    if (urlDatabase[urls].userID === id) {
      userURLs[urls] = urlDatabase[urls].longURL;
    }
  }
  return userURLs;
};


//*** GET requests ***//

app.get("/", (req, res) => {
  const specificUser = req.session.user_id;
  const templateVars = {
    user: users[specificUser]
  };
  if (specificUser) {
    res.redirect('/urls');
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const specificUser = req.session.user_id;
  const id = req.params.id;
  const userURLs = urlsForUser(specificUser);
  const templateVars = {
    id: id,
    urls: userURLs,
    user: users[specificUser]
  };

  if (!specificUser) {
    res.render('err_login', templateVars);
  } else {
    res.render('urls_index', templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const specificUser = req.session.user_id;
  const templateVars = {
    user: users[specificUser]
  };
  if (!specificUser) {
    res.redirect('/login');
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  const specificUser = req.session.user_id;
  const templateVars = {
    user: users[specificUser]
  };
  if (specificUser) {
    res.redirect('/urls');
  } else {
    res.render("urls_register", templateVars);
  }
});

app.get("/login", (req, res) => {
  const specificUser = req.session.user_id;
  const templateVars = {
    user: users[specificUser]
  };
  if (specificUser) {
    res.redirect('/urls');
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const specificUser = req.session.user_id;
  const id = req.params.id;
  const templateVars = {
    id: id,
    longURL: urlDatabase[id].longURL,
    user: users[specificUser]
  };

  const userURLs = urlsForUser(specificUser);
  const shortURLs = Object.keys(userURLs);

  if (!specificUser || !shortURLs.find(url => url === id)) {
    res.render('err_login', templateVars);
  } else {
    res.render('urls_show', templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  const specificUser = req.session.user_id;
  const id = req.params.id;
  if (!urlDatabase[id]) {
    const templateVars = {
      id: id,
      user: users[specificUser]
    };
    res.render('err_notfound', templateVars);
  } else {
    res.redirect(urlDatabase[id].longURL);
  }
});


//*** POST requests ***//

// Route for creation of short URL
app.post("/urls", (req, res) => {
  const specificUser = req.session.user_id;

  if (!specificUser) {
    res.send(`
    <html>
      <body>
        <h1>You must be logged in to edit URLs!</h1>
        <h2><a href="/login">Login here</a></h2>
        <h2><a href="/register">Register here</a></h2>
      </body>
    </html>
    \n`);
  } else {
    let shortURL = generateRandomString();

    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: specificUser
    };

    res.redirect(`/urls/${shortURL}`);
  }
});

// Route for deleting a URL
app.post("/urls/:id/delete", (req, res) => {
  const specificUser = req.session.user_id;
  const id = req.params.id;

  const userURLs = urlsForUser(specificUser);

  if (!specificUser)
    return res.status(403).send('You do not have permission to delete this URL.');

  const shortURLs = Object.keys(userURLs);

  if (shortURLs.find(url => url === id)) {
    delete urlDatabase[id];
    res.redirect('/urls');
  } else {
    return res.status(403).send('You do not have permission to delete this URL.');
  }
});

// Route for editing a URL
app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.editedURL;
  urlDatabase[id].longURL = longURL;
  res.redirect('/urls');
});

// Route for logins
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userToLogin = getUserByEmail(email, users);

  if (!userToLogin)
    return res.status(403).send('Email not found.');
  
  if (bcrypt.compareSync(password, userToLogin.password)) {
    req.session.user_id = userToLogin.id;
    res.redirect('/urls');
  } else {
    return res.status(403).send('Password does not match.');
  }
});

// Route for logouts
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// Route for registering new account
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email)
    return res.status(400).send('Please enter a valid email.');

  if (!password)
    return res.status(400).send('Please enter a valid password.');

  if (getUserByEmail(email, users))
    return res.status(400).send('Email already in use.');

  let userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: email,
    password: hashedPassword
  };
  req.session.user_id = userID;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp server is up and listening on port ${PORT}!`);
});