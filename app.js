var createError = require('http-errors');
var express = require('express');
var path = require('path');
const bodyparser=require('body-parser');
const session=require('express-session');

var cookieParser = require('cookie-parser');
var logger = require('morgan');

// var hbs=require('express-handlebars')
var expbs=require('express-handlebars')

var db=require('./configuration/connection')
var axios=require('axios')
const nocache = require("nocache");


const cors = require("cors")


var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');


var app = express();

const hbs=expbs.create({
  extname: 'hbs',defaultLayout: 'layout',
   layoutsDir:__dirname + '/views/layout/', 
   partialsDir:__dirname + '/views/partials/',

   helpers:{
   
      ifEquals:(value1,value2,value3,options)=>{

        if(value1==value2){
            if(value3){
                return options.fn(value3)
            }
           return options.fn()
        }else{
            if(value3)
            {   
                return options.inverse(value3);      
            }
            return options.inverse();   
        }
    },
 
      indexing:(index,page,limit)=>{
        if(page&&limit){
          return ((parseInt(page)-1)*limit)+parseInt(index)+1
        }else{
          return parseInt(index)+1;
        }
        

    },
    checkGreater:(categoryPrice,productPrice)=>{
      productPrice= (productPrice==undefined)?0:parseInt(productPrice)
      return (parseInt(categoryPrice)>productPrice)?categoryPrice:productPrice
    }
   }

})

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))





// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// app.engine('hbs', hbs.engine ({extname: 'hbs',defaultLayout: 'layout', layoutsDir:__dirname + '/views/layout/', partialsDir:__dirname + '/views/partials/'}));

app.engine('hbs', hbs.engine);


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session(
  {secret:'key',cookie:{maxAge:6000000000}}
))


app.use(nocache());
app.use(cors())
db.connect((err)=>{
  if(err)console.log('Connection Error'+err)
  else console.log('Database connnected');
})





app.use('/', userRouter);
app.use('/admin', adminRouter);

app.get('/admin/*',(req,res)=>{
  res.render('admin/error',{admin:true,noheader:true})
})


app.get('/*',(req,res)=>{
  res.render('user/error')
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};




// ----------------------------------------------------------ERROR HANDLING-------------------------------------------------------------------//





  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
