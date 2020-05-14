
var express = require('express');
var router = express.Router();
var enrollAdmin = require('./functions/enrollAdmin');
var registerUser = require('./functions/registerUser');
var query = require('./functions/query');
var invoke = require('./functions/invoke');
var createUser = require('./functions/createUser');
var queryUser = require('./functions/queryUser');
var bcrypt = require('bcrypt')
var csrf = require('csurf');
var csrfProtection = csrf();



var app = require("../app");
router.use(csrfProtection);

function makeid(length) {
   var result = '';
   var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
function enc_password(pass) {
   return bcrypt.hashSync(pass, bcrypt.genSaltSnc(6), null);
};



router.get('/profile', checkSignIn, function (req, res, next) {
   res.render('user/profile', { name: req.session.name })
});

router.get('/logout', function (req, res, next) {
   req.session.destroy(function () {
      console.log("user logged out.")
   });
   res.redirect('/user/login');
});
router.get('/', checkSignIn, function (req, res, next) {
   next();
});
////////////////////
router.get('/signup', async function (req, res, next) {
   res.render('user/signup', { csrfToken: req.csrfToken() });
});


router.post('/signup', async function (req, res, next) {
   try{
   if (!req.body.email || !req.body.password) {
      res.status("400");
      res.send("Invalid details!");
   } else {
      var result = await queryUser(req.body.email);
   //console.log(result);
   //if(result === "[]")console.log("YES");
      if (result === "[]") {
         var id = req.body.id;
         var name = req.body.name;
         var email = req.body.email;
         var pass = req.body.password;

         var phone = req.body.phone;
         var userType = req.body.userType;
         var key = makeid(15);

         await createUser(key, id, name, email, pass, phone, userType);
         // res.send(JSON.stringify({key, id, name, email, pass, phone, userType}));

         console.log("You have been succesfully registered.");
         req.session.name = name;
         req.session.id = NID;
         res.redirect('/user/profile');
      }
      else {
         var obj = JSON.parse(result);
         var x = obj[0].Record;
         var checked_mail = x.Email;
         if (checked_mail === req.body.email) {
            res.render('user/signup', {
               message: "User Already Exists! Login or choose another user Email"
            });
         }
      }
   } 
} catch (error) {
      //res.status(error.response.status)
      return res.send(error.message);
   }

});


router.get('/login', function (req, res, next) {
   res.render('user/login', { csrfToken: req.csrfToken() });
});

router.post('/login', async function (req, res, next) {
   try {
      if (!req.body.email || !req.body.password) {
         res.render('user/login', { message: "Please enter both email and password" });
      }
      var result = await queryUser(req.body.email);
      if (result === "") {
         req.session.error = true;
         res.redirect('/user/login', { message: "Invalid credentials!" });
      }
      else {
         var obj = JSON.parse(result);
         var x = obj[0].Record;

         // console.log(obj);
         // console.log(x.NID);
         //res.send(result.toString());

         if (x.Email === req.body.email && x.Password === req.body.password) {
            req.session.name = x.Name;
            req.session.id = x.NID;
            res.redirect('/user/profile');
         }
         else {
            req.session.error = true;
            //console.log("error er eikhane asche");
            //res.redirect('/user/login');
            res.redirect('/user/login', { message: "Invalid credentials!" });
         }
      }


   } catch (error) {
      //res.status(error.response.status)
      return res.send(error.message);
   }
});




module.exports = router;
function checkSignIn(req, res, next) {
   if (req.session.name) {
      next();     //If session exists, proceed to page
   } else {
      //res.redirect('/');
      var err = new Error("Not logged in!");
      console.log(req.session.name);
      next(err);  //Error, trying to access unauthorized page!
   }
}