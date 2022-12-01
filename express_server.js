const { application } = require("express");
const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//*** Values ***//

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  },
  "abcde9": {
    longURL: "http://www.google.ca",
    userID: "user2RandomID"
  },
  "ie8i3n": {
    longURL: "https://www.bbc.com/sport/football",
    userID: "user2RandomID"
  }
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

// Helper function for looking up users by email address
const getUserByEmail = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
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
  res.send("TinyApp Server is up!");
});

app.get("/urls", (req, res) => {
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie

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

    const userURLs = urlsForUser(specificUser);

    const templateVars = {
      urls: userURLs,
      user: users[specificUser]
    };
    console.log('templateVars:', templateVars);

    res.render('urls_index', templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
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
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
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
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
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
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
  const id = req.params.id;
  const templateVars = {
    id: id,
    longURL: urlDatabase[id], // Changed
    user: users[specificUser]
  };

  if (!specificUser) {
    res.send("<html><body><h1>You must be logged in to edit URLs!</h1></body></html>\n");
  } else {
    res.render('urls_show', templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  if (!urlDatabase[id]) {
    res.send("<html><body><h1>That short URL does not exist.</h1></body></html>\n");
  } else {
    res.redirect(longURL);
  }
});


//*** POST requests ***//

// Route for creation of short URL
app.post("/urls", (req, res) => {
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
  let shortURL = generateRandomString();
  urlDatabase[shortURL].longURL = req.body.longURL;

  if (!specificUser) {
    res.send("<html><body><h1>You must be logged in to edit URLs!</h1></body></html>\n");
  } else {
    res.redirect(`/urls/${shortURL}`);
  }
});

// Route for deleting a URL
app.post("/urls/:id/delete", (req, res) => {
  const specificUser = req.cookies["user_id"]; // grabs current user from cookie
  const id = req.params.id;

  const userURLs = urlsForUser(specificUser);

  console.log('id:', id);
  // console.log('urlDBID:', urlDatabase[id]);
  console.log('userurls:', userURLs);

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
  const userToLogin = getUserByEmail(email);

  if (!userToLogin)
    return res.status(403).send('Email not found.');
  
  if (userToLogin.email && userToLogin.password !== password)
    return res.status(403).send('Password does not match.');
    
  res.cookie('user_id', userToLogin.id);
  res.redirect('/urls');
});

// Route for logouts
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// Route for registering new account
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email)
    return res.status(400).send('Please enter a valid email.');

  if (!password)
    return res.status(400).send('Please enter a valid password.');

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
});

app.listen(PORT, () => {
  console.log(`TinyApp server is up and listening on port ${PORT}!`);
});