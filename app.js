//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltround = 10;

mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://'+process.env.USERNAME+':'+process.env.PASSWORD+'@casper.vtagobj.mongodb.net/userDB?retryWrites=true&w=majority');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = new mongoose.model('User', userSchema);

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res)=>{
    res.render('home');
});

app.get('/register', (req, res)=>{
    res.render('register');
});

app.post('/register', (req, res)=>{
    bcrypt.hash(req.body.password, saltround, (err, hash)=>{
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save((err)=>{
            if(err){
                console.log(err);
            }else{
                res.render('secrets');
            }
        });
    });
});

app.get('/login', (req, res)=>{
    res.render('login');
});

app.post('/login', (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username}, (err, foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                bcrypt.compare(password, foundUser.password, (err, result)=>{
                    if(result){
                        res.render('secrets');
                    }else{
                        console.log('password is incorrect');
                    }
                });
            }else{
                console.log('username not found');
            }
        }
    });
});

app.listen(3000, ()=>{
    console.log('App running on port 3000')
});