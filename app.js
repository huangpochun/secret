//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'oursecret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://'+process.env.USERNAME+':'+process.env.PASSWORD+'@casper.vtagobj.mongodb.net/userDB?retryWrites=true&w=majority');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, {id: user.id});
    });
});
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  (accessToken, refreshToken, profile, cb)=>{
    User.findOrCreate({ googleId: profile.id }, (err, user)=> {
        return cb(err, user);
    });
  }
));

app.get('/', (req, res)=>{
    res.render('home');
});

app.get('/register', (req, res)=>{
    res.render('register');
});

app.get('/secrets', (req, res)=>{
    User.find({'secret': {$ne: null}}, (err, foundUsers)=>{
        if(err){
            console.log(err);
        }else{
            res.render('secrets', {users: foundUsers});
        }
    });
});

app.post('/register', (req, res)=>{
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate('local')(req, res, ()=>{
                res.redirect('/secrets');
            });
        }
    });
});

app.get('/login', (req, res)=>{
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/secrets',
    failureRedirect: '/login'
}));

app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile']
}));

app.get('/auth/google/secrets', passport.authenticate('google', {
    failureRedirect: '/login' 
}), (req, res)=> {
    res.redirect('/secrets');
});

app.get('/submit', (req, res)=>{
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect('/login');
    }
});

app.post('/submit', (req, res)=>{
    const secretMessage = req.body.secret;
    User.findById(req.user.id, (err, foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = secretMessage;
                foundUser.save((err)=>{
                    if(!err){
                        res.redirect('/secrets');
                    }
                });
            }
        }
    });
});

app.get('/logout', (req, res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect('/');
        }
    });
});

app.listen(3000, ()=>{
    console.log('App running on port 3000')
});