require('dotenv').config();
const bodyParser    = require('body-parser');
const cookieParser  = require('cookie-parser');
const express       = require('express');
const hbs           = require('hbs');
const mongoose      = require('mongoose');
const logger        = require('morgan');
const path          = require('path');
const favicon       = require('serve-favicon');
const flash         = require('connect-flash');
const session       = require('express-session');
const passport      = require("./auth/passport");
const Mongostore    = require("connect-mongo")(session);


mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(x => console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`))
  .catch(err => console.error('Error connecting to mongo', err));

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);
const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());
// Middleware for sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new Mongostore({
      mongooseConnection: mongoose.connection
    })
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Express View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

const Router = require('./routes/index');
app.use('/', Router);
const adminRouter = require('./routes/admin-routes');
app.use('/admin', adminRouter);
const appRoutes = require('./routes/app-routes');
app.use('/app', appRoutes);

module.exports = app;