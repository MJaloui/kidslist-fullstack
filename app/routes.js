const { ObjectId } = require('mongodb');

const toObjectId = (id) => {
  try {
    return new ObjectId(id);
  } catch (err) {
    return null;
  }
};

module.exports = function (app, passport, db) {
  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  // PROFILE SECTION =========================
  app.get('/profile', isLoggedIn, function (req, res) {
    db.collection('gifts')
      .find({ userId: req.user._id })
      .sort({ purchased: 1, createdAt: -1 })
      .toArray((err, gifts) => {
        if (err) return console.log(err);
        res.render('profile.ejs', {
          user: req.user,
          gifts
        });
      });
  });

  // LOGOUT ==============================
  app.get('/logout', function (req, res) {
    req.logout(() => {
      console.log('User has logged out!');
    });
    res.redirect('/');
  });

  // gift routes ===============================================================

  app.post('/gifts', isLoggedIn, (req, res) => {
    const price = req.body.price ? Number(req.body.price) : null;
    const payload = {
      title: req.body.title || 'Untitled Gift',
      link: req.body.link || '',
      price: isFinite(price) ? price : null,
      recipient: req.body.recipient || '',
      purchased: false,
      rating: null,
      greatBuyCount: 0,
      dontBuyCount: 0,
      userId: req.user._id,
      createdAt: new Date()
    };

    db.collection('gifts').insertOne(payload, err => {
      if (err) return console.log(err);
      res.redirect('/profile');
    });
  });

  app.post('/gifts/update', isLoggedIn, (req, res) => {
    const giftId = req.body.id;
    const giftObjectId = toObjectId(giftId);
    if (!giftObjectId) return res.redirect('/profile');

    const price = req.body.price ? Number(req.body.price) : null;

    db.collection('gifts').findOneAndUpdate(
      { _id: giftObjectId, userId: req.user._id },
      {
        $set: {
          title: req.body.title || 'Untitled Gift',
          link: req.body.link || '',
          price: isFinite(price) ? price : null,
          recipient: req.body.recipient || ''
        }
      },
      {},
      err => {
        if (err) return console.log(err);
        res.redirect('/profile');
      }
    );
  });

  app.post('/gifts/purchased', isLoggedIn, (req, res) => {
    const giftId = req.body.id;
    const giftObjectId = toObjectId(giftId);
    if (!giftObjectId) return res.redirect('/profile');

    const purchased = req.body.purchased === 'true';

    db.collection('gifts').findOneAndUpdate(
      { _id: giftObjectId, userId: req.user._id },
      { $set: { purchased } },
      {},
      err => {
        if (err) return console.log(err);
        res.redirect('/profile');
      }
    );
  });

  app.post('/gifts/reset-rating', isLoggedIn, (req, res) => {
    const giftId = req.body.id;
    const giftObjectId = toObjectId(giftId);
    if (!giftObjectId) return res.redirect('/profile');

    db.collection('gifts').findOneAndUpdate(
      { _id: giftObjectId, userId: req.user._id },
      { $set: { greatBuyCount: 0, dontBuyCount: 0, rating: null } },
      { returnOriginal: false },
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const doc = result && (result.value || result);
        if (!doc) return res.status(404).json({ error: 'Gift not found' });

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          return res.json({ greatBuyCount: 0, dontBuyCount: 0, rating: null });
        }

        res.redirect('/profile');
      }
    );
  });

  app.put('/gifts/review', isLoggedIn, (req, res) => {
    const giftId = req.body.id;
    const giftObjectId = toObjectId(giftId);
    if (!giftObjectId) return res.status(400).json({ error: 'Invalid gift id' });

    const action = req.body.action;
    let update;

    if (action === 'up') {
      update = {
        $inc: { greatBuyCount: 1 },
        $set: { rating: 'great' }
      };
    } else if (action === 'down') {
      update = {
        $inc: { dontBuyCount: 1 },
        $set: { rating: 'dont' }
      };
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    db.collection('gifts').findOneAndUpdate(
      { _id: giftObjectId, userId: req.user._id },
      update,
      { returnOriginal: false },
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const doc = result && (result.value || result);
        if (!doc) return res.status(404).json({ error: 'Gift not found' });
        res.json({
          greatBuyCount: doc.greatBuyCount || 0,
          dontBuyCount: doc.dontBuyCount || 0,
          rating: doc.rating || null
        });
      }
    );
  });

  app.post('/gifts/delete', isLoggedIn, (req, res) => {
    const giftId = req.body.id;
    const giftObjectId = toObjectId(giftId);
    if (!giftObjectId) return res.redirect('/profile');

    db.collection('gifts').findOneAndDelete(
      { _id: giftObjectId, userId: req.user._id },
      err => {
        if (err) return res.sendStatus(500);
        res.redirect('/profile');
      }
    );
  });

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function () {
      res.redirect('/profile');
    });
  });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}
