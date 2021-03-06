const router = require(`express`).Router();
const { User, Post, Comment, Vote } = require(`../../models`);

// GET /api/users
//* Retrieves all users
router.get(`/`, (req, res) => {
  // Access our User model and run .findAll() method)
  //* find.All() is the JS equivalent of SQL SELECT * FROM user;.
  User.findAll({
    //* password is within an array to allow us to add more password columns as we go
    attributes: { exclude: [`password`] },
  })
    .then((dbUserData) => res.json(dbUserData))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// GET /api/users/1
//* Finds one user by id
router.get(`/:id`, (req, res) => {
  //* findOne() w/ 'where' identifier, is the JS equivalent of SQL
  //* SELECT * FROM users WHERE id = 1;.
  User.findOne({
    attributes: { exclude: [`password`] },
    where: {
      id: req.params.id,
    },
    include: [
      {
        model: Post,
        attributes: [`id`, `title`, `post_url`, `created_at`],
      },
      {
        model: Comment,
        attributes: [`id`, `comment_text`, `created_at`],
        include: {
          model: Post,
          attributes: [`title`],
        },
      },
      {
        model: Post,
        attributes: [`title`],
        through: Vote,
        as: `voted_posts`,
      },
    ],
  })
    .then((dbUserData) => {
      if (!dbUserData) {
        res.status(404).json({ message: `No user found with this id` });
        return;
      }
      res.json(dbUserData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// POST /api/users
//* Creates a new user.
router.post(`/`, (req, res) => {
  // expects {username: 'Lernantino', email: 'lernantino@gmail.com', password: 'password1234'}
  //* creat() methods allows use to insert data; similar to SQL
  //* INSERT INTO users (username, email, password)
  //* VALUES ('Lernantino', 'lernantino@gmail.com', 'password1234').
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  })
    .then((dbUserData) => {
      req.session.save(() => {
        req.session.user_id = dbUserData.id;
        req.session.username = dbUserData.username;
        req.session.loggedIn = true;

        res.json(dbUserData);
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// User login
//* Used POST instead of GET because the GET method carries the request parameter appended in the URL string,
//* whereas the POST method carries the request parameter in req.body, which makes it a more secure way to send client information
//* from the user to the server.
router.post(`/login`, (req, res) => {
  // expects {email: 'lernantino@gmail.com', password: 'password1234'}
  User.findOne({
    where: {
      email: req.body.email,
    },
  }).then((dbUserData) => {
    if (!dbUserData) {
      res.status(400).json({ message: `No user with that email address! ` });
      return;
    }

    const validPassword = dbUserData.checkPassword(req.body.password);
    if (!validPassword) {
      res.status(400).json({ message: `Incorrect Password!` });
      return;
    }
    req.session.save(() => {
      // declare session variables
      req.session.user_id = dbUserData.id;
      req.session.username = dbUserData.username;
      req.session.loggedIn = true;

      res.json({ user: dbUserData, message: ` You are now logged in!` });
    });
  });
});

router.post(`/logout`, (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

// PUT /api/users/1
router.put(`/:id`, (req, res) => {
  // expects {username: 'Lernantino', email: 'lernantino@gmail.com', password: 'password1234'}

  // if req.body has exact key/value pairs to match the model, you can just use `req.body` instead
  //* SQL equivalent = UPDATE users SET username = `Lernantino`, email = `lernantino@gmail.com`, password = `newPassword1234` WHERE id = 1;.
  User.update(req.body, {
    individualHooks: true,
    where: {
      id: req.params.id,
    },
  })
    .then((dbUserData) => {
      if (!dbUserData[0]) {
        res.status(404).json({ message: `No user found with this id` });
        return;
      }
      res.json(dbUserData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// DELETE /api/users/1
router.delete(`/:id`, (req, res) => {
  User.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((dbUserData) => {
      if (!dbUserData) {
        res.status(404).json({ message: `No user found with this id` });
        return;
      }
      res.json(dbUserData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;

//* API Architectural Pattern REST = REpresentational State Transfer.
//* APIs built following this pattern as what's known as RESTful APIs
