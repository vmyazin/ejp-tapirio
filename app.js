let createError = require("http-errors");
let express = require("express");
let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");
let sass = require('sass');

let indexRouter = require("./routes/index");
let usersRouter = require("./routes/users");

let app = express();

// view engine setup
app.set("views", path.join(__dirname, "pages"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Compile Sass on startup
sass.render({
  file: path.join(__dirname, 'scss/styles.scss'),
  outFile: path.join(__dirname, 'public/stylesheets/styles.css'),
  outputStyle: 'compressed',
  sourceMap: true
}, function(error, result) {
  if (!error) {
    require('fs').writeFileSync(path.join(__dirname, 'public/stylesheets/styles.css'), result.css);
    if (result.map) {
      require('fs').writeFileSync(path.join(__dirname, 'public/stylesheets/styles.css.map'), result.map);
    }
  } else {
    console.error('Sass compilation error:', error);
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
