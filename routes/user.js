
var express = require('express');
var router = express.Router();


require('dotenv').config()
console.log(process.env.authId)




const paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox',
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
});







require('dotenv').config()
const productHelpers = require('../helpers/product-helpers.js');
const userHelpers = require('../helpers/user-helpers')
const categoryHelpers=require('../helpers/category-helpers')
const offerHelpers=require('../helpers/offer-helpers')
const couponHelpers=require('../helpers/coupon-helpers');
const { Db } = require('mongodb');


let loginerror;
let grandTotal

//---------------------------------------------------------------------Twilio -------------------------------------------------------------------------\\

const serviceSId = process.env.serviceSId;
const accountSSid = process.env.accountSSid
const authId = process.env.authId
const client = require('twilio')(accountSSid, authId)


//----------------------------------------------------------------------Twilio --------------------------------------------------------------------------\\




 async function paginatedResults(req, res, next) {   
  const page = parseInt(req.query.page) 
  const limit =3
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
   
  const results = {}
  let productsCount=await productHelpers.getProductsCount()
  if (endIndex < productsCount) {
    results.next = {
      page: page + 1,
      limit: limit
    }
  }
  
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit
    }
  }
  try {
    results.products = await productHelpers.getPaginatedResult(limit,startIndex) 
    results.pageCount =Math.ceil(parseInt(productsCount)/parseInt(limit)).toString() 
    results.pages =Array.from({length: results.pageCount}, (_, i) => i + 1)    
    results.currentPage =page.toString()
    res.paginatedResults = results 
    next()

  } catch (e) {
    res.status(500).json({ message: e.message })
  } 
}


// let mob;
// let user;


const verifyLogin = async (req, res, next) => { 
  if (req.session.loggedIn) {   
    next()
  } else {
    res.redirect('/login')
  }
}

const sessionHandle = (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    next();
  }
}



router.use('/', async function (req, res, next) {
  if (req.session.loggedIn){
    res.locals.user= req.session.user
    wishlistCount= await userHelpers.wishlistCount(req.session.user._id)
    cartCount = await userHelpers.getCartCount(req.session.user._id)  
    res.locals.cartCount = cartCount
  } else {
    res.locals.wishlistCount=null
    res.locals.cartCount = null   
  }
  req.app.locals.layout = 'layout'
  next();
});

// ------------------------------------------------set-----------------------------------------------------------//

// ---------------------------------------------------------------------NAVBAR SEARCH-------------------------------------------------------//

router.post('/searchProducts',(req,res)=>{ 
  try{

  let payload=req.body.payload.trim()
  productHelpers.getSearchedProducts(payload).then((search)=>{
     res.json({payload:search})
  })
}catch(e){
  console.log(e);
 
}
})


/* ---------------------------------------------------GET home page----------------------------------------------------------------------. */
router.get('/', async function (req, res, next) {
  try{
    let user = req.session.user    
  if (req.session.loggedIn) {

    let category=await categoryHelpers.getCategory()
    productHelpers.getAllproducts().then((products) => {
      res.render('user/indextwo', { loginaano: req.session.loggedIn, products, cartCount ,category,wishlistCount})
    })
  }
  else{
  let category=await categoryHelpers.getCategory()
  productHelpers.getAllproducts().then((products) => {
    res.render('user/indextwo', { loginaano: req.session.loggedIn, products ,category})
  })
}
}catch(e){
  console.log(e);
  res.status(404).send(e)
}
})
/*--------- GET home page. */


// ------------------------------------------------------------LOGIN PAGE---------------------------------------------------------------//
router.get('/login', sessionHandle, (req, res) => {
  res.render('user/login', { loginerror})
  loginerror = ""
})

// ----------------------------------------------------------Home PAGE-------------------------------------------------------------------//

router.post('/login', (req, res) => {
  try{
  userHelpers.dologin(req.body).then((response) => {

    if (response.status) {
      req.session.user = response.user             // user ivide assign cheyyunnu 
      // user = req.session.user
      req.session.loggedIn = true
      res.redirect('/')
    } else {
      loginerror = response.error
      res.redirect('/login')
    }
  })
}catch(e){
  console.log(e);
  res.status(400)
}

})


// ---------------------------------------------------------- GET signup-----------------------------------------------------------------------------// 
router.get('/signup', (req, res) => {
  try{

  res.render('user/signup')
}catch(e){
  console.log(e);
  res.status(500).send(e)

}
})


// --------------------------------------------------------post signup-------------------------------------------------------------------------/ 
router.post('/signup', (req, res) => {
  try{

  let body = req.body
  userHelpers.doSignup(body).then((response) => {
    if (response.signuperr) {
      res.render('user/signup', { userexist: true })
    } else {
      userHelpers.AddStatus(response.userData).then(() => {
        res.redirect('/')
      })
    }
  })
}catch(e){
  console.log(e);
}
})
// ------------------post signup-----------------// 


// router.get('/', function(req, res) {
//   let user=req.session.user//req kodukkumbol namukk kittunna  datas session il store cheyyum. ath user nn pGE ULLA JS File il koodiyan pokunath
//   productHelpers.getAllproducts().then((products)=>{
//   res.render('user/indextwo');
// })
// });




//  router.get('/login',(req,res)=>{  
// if(req.session.user){
//   res.redirect('/')
// }else
//   res.render('user/login',{loginErr:req.session.userloginErr,noheader:false})
// req.session.userloginErr=false
//  })

// router.get('/signup',(req,res)=>{
//        res.render('user/signup',{noheader:false})
// }) 


// ------------------------------------------------------login with otp-------------------------------------------------------------------

router.get('/loginotp', sessionHandle, (req, res) => {
  res.render('user/loginOtp')
})



// ------------------------------------------------------------------resend otp------------------------------------------------------------
router.get('/resend', (req, res) => {
  try{
  if (mob) {
    client.verify
      .services(serviceSId)
      .verifications.create({
        to: `+91${mob}`,
        channel: "sms"
      }).then(() => {
        res.redirect('/mobile')
      })
  }
}catch(e){
  console.log(e);
  res.status(401).send(e)
}
})



// --------------------------------------------------------otp creation-------------------------------------------------------------------------
router.post('/loginotp', sessionHandle, (req, res) => {
  try{
    // req.session.mobile = req.body.number
    // mob =parseInt(req.session.mobile)
    console.log(req.body);
  userHelpers.mobileOtp(req.body).then((response) => {
  
  
    console.log('mob  &&&&&&&&&&');
    console.log(response);
   
    
    req.session.user = response.user
    mob=parseInt(req.session.user.number)
    console.log(mob);
    console.log(typeof(mob));

  //  let user = req.session.user

    client.verify
      .services(serviceSId)
      .verifications.create({
        to: `+91${mob}`,
        channel: "sms"
      }).then((response) => {
        console.log('OOOOOOOOOO');
        console.log(response);
        req.session.user = response.user
        req.session.userloginErr = false
        res.redirect('/mobile')
      })
  }).catch((err) => {
    console.log(err);
  })
}catch(e){

  res.status(500).send(e)
}
})




// -------------------------------------------------------OTP TYPING PAGE--------------------------------------------------------------------
router.get('/mobile', (req, res) => {
  res.render('user/mobile')
})
// ---------OTP TYPING PAGE-----


// ------------------------------------otp verification--------------------------------------------------------------------------------------------
router.post('/mobile', (req, res) => {
  try{

  const { otp } = req.body
  const mob = parseInt(req.session.user.number)
  client.verify
    .services(serviceSId)
    .verificationChecks.create({
      to: `+91${mob}`,
      code: otp
    }).then((response) => {

      if (response.valid) {
        req.session.loggedIn = true
        res.render('user/indextwo', { cartCount, loginaano: req.session.loggedIn })
      } else {
        res.render('user/loginOtp', { valid: true })
      }
    })
  }catch(e){
    console.log(e);
    res.status(500).send(e)
  }
})


// ----------------------------------------------------GETTING DETAILS OF ONEPRODUCT THAT CLICKED BY USER-------------------------------------//
router.get('/product/:id', verifyLogin, (req, res) => {
  try{
  let id = req.params.id
  productHelpers.getProductDetails(id, req.body).then((products) => {
    res.render('user/productOverview', { products, cartCount, loginaano: req.session.loggedIn})
  })
}catch(e){
  console.log(e);
}
})



// ----------------------------------------------------PRODUCT OVERVIEW-----------------------------------------------------------------------

  router.get('/product-page' , paginatedResults,async (req, res) => {
    try{
    if(req.session.loggedIn){
  let products =res.paginatedResults.products
  let next =res.paginatedResults.next
  let previous=res.paginatedResults.previous
  let pages =res.paginatedResults.pages
  let pageCount =res.paginatedResults.pageCount
  let currentPage =res.paginatedResults.currentPage

  let category=await categoryHelpers.getCategory()
     
  let wishlistCount = await userHelpers.wishlistCount(req.session.user._id)
    res.render('user/products', { products,next,previous,pages,pageCount,currentPage,loginaano: req.session.loggedIn,category,wishlistCount})
  }else{
    let products =res.paginatedResults.products
    let next =res.paginatedResults.next
    let previous=res.paginatedResults.previous
    let pages =res.paginatedResults.pages
    let pageCount =res.paginatedResults.pageCount
    let currentPage =res.paginatedResults.currentPage
    
  let category=await categoryHelpers.getCategory()
  res.render('user/products', { products,next,previous,pages,pageCount,currentPage,loginaano: req.session.loggedIn,category})

  }
    }catch(e){
      console.log(e);
    }
  })

// -----------------------------------------------------------FILTER IN CATEGORY PAGE---------------------------------------------------------------//
router.post('/categoryFilter',async(req,res)=>{
  try{
  
 let category=await categoryHelpers.filterdCat(req.body)
 let cat=await categoryHelpers.getCategory()
  res.render('user/categories',{category, cat})
  }catch(e){
    console.log(e);
  }
})

router.get('/categories', (req, res) => {
  try{
  productHelpers.getAllproducts().then((products) => {          
    res.render('user/categories', { products, loginaano: req.session.loggedIn,cartCount})
  })
}catch(e){
  console.log(e);
  res.status(400).send(e)
}
})


// --------------------------------------------------------LOGOUT-------------------------------------------------------------------------

router.get('/logout', (req, res) => {
  try{
  req.session.loggedIn = null
  res.redirect('/')
  }catch(e){
    console.log(e);
  }
})

// --------------------------------------------------------SHOWING CART PAGE----------------------------------------------------------------------
router.get('/cart', verifyLogin, async (req, res) => {
  try{
    let user=req.session.user
  let products = await userHelpers.getCartProductsinCart(user._id)       //GETTING PRODUCTS
  products.forEach(element => {
    if (element.product.stock == 0) {
      element.stockFinishedStatus = true
    } else {
      element.stockFinishedStatus = false
    }
  })
  userHelpers.getGrandtotal(user._id).then(async(grandtotal) => {       //GETTING GRAND TOTAL
    if (grandtotal[0]) {
      grandTotal = grandtotal[0].grandtotal
    } else {
      grandTotal = grandtotal[0]
    }
    let discounts=await userHelpers. ViewCartDiscount(user._id,grandTotal)
       discount=discounts[0]
    res.render('user/cart', { products, cartCount, grandTotal, loginaano: req.session.loggedIn,discount,wishlistCount})

  })
}catch(e){
  console.log(e);
}
})

// ------------------------------------------------------------COUPON IN CART-----------------------------------------------------------------//

router.post('/couponincart', (req, res) => {
  try{
    let user=req.session.user
  
  userHelpers.getGrandtotal(user._id).then((grandtotal) => {       //GETTING GRAND TOTAL
    if (grandtotal[0]) {
      grandTotal = grandtotal[0].grandtotal
    } else {
      grandTotal = grandtotal[0]
    } 
    userHelpers.couponCheck(req.body, grandTotal, user._id).then((response) => {
      res.json(response)
    })
  })
}catch(e){
  console.log(e);
}
})



router.get('/deletecoupon',(req,res)=>{
  try{
  let user=req.session.user

  userHelpers.deleteCoupon(user._id).then(()=>{
    res.redirect('/cart')
  })
}catch(e){
  console.log(e);
}
})
// ---------------------------------------------------- REMOVE FROM CART-----------------------------------------------------------------//
router.post('/remove-cart', (req, res) => {
  try{
  userHelpers.removecartItem(req.body).then((response) => {
    res.redirect('/cart')
  })
}catch(e){
  console.log(e);
}
})

// ------------------------------------------------------ADD TO CART---------------------------------------------------------------------//
router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  try{
  let user=req.session.user

  userHelpers.addtocart(req.params.id, user._id).then(() => {
    res.redirect('/cart')
  })
}catch(e){
  console.log(e);
}
})

// router.get('/wishlist-add-to-cart/:id', verifyLogin, (req, res) => {
//   try{
    
//   userHelpers.addtocart(req.params.id, user._id).then(() => {
//     res.redirect('/cart')
//   })
// }catch(e){
//   console.log(e);
// }
// })

// ----------------------------------------------------CHECKOUT------------------------------------------------------------------------
router.get("/place-order", verifyLogin, async (req, res) => {
  try{
  let user=req.session.user


  if(cartCount>0){
    let total = await userHelpers.getTotalAmount(user._id)
    let discounts=await userHelpers.ViewCartDiscount(user._id,total[0].total)
    let products = await userHelpers.getCartProducts(user._id)
    userHelpers.getAddress(user._id).then((Address) => {
      res.render('user/checkout', { total, grandTotal, products, loginaano: req.session.loggedIn, Address,discounts,cartCount})
    })
  }else{
    userHelpers.getAddress(user._id).then((Address) => {
      res.render('user/checkout', {loginaano: req.session.loggedIn, Address})
    })
  } 
}catch(e){
  console.log(e);
} 
})



router.post('/place-order',async (req, res) => {
  try{
  let user=req.session.user

  if (cartCount){
  let cartItems = await userHelpers.cartDetails(user._id)
  let discounts=await userHelpers.ViewCartDiscount(user._id,grandTotal)
  let discount=discounts[0]
  userHelpers.placeOrder(req.body, user._id, cartItems, grandTotal,discount).then((data) => {
    console.log(data)
   
    orderId = data[0]._id
    
    data.forEach(element => {
      userHelpers.decrementStock(element)
      console.log(element);
    })

    if (req.body['paymentMethod'] == 'COD') {
      console.log("its cod")
      res.json({ codsuccess: true })
    }
    else if (req.body['paymentMethod'] == 'Paypal') {
      console.log("its paypal")
      res.json({ paypal: true, orderId })
    }
    else {
      
      

      userHelpers.generateRazorpay(orderId, grandTotal,discount).then((response) => {
        res.json(response)
      })
    }
  })
}else{
  
  res.redirect('/product-page')
}
  }catch(e){
    console.log(e);
  }
})


// --------------------------------------------------------------PAYPAL PAYMENT------------------------------------------------------------------
 router.post('/pay', (req, res) => {
  try{

  const create_payment_json = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": "http://localhost:3000/success",
      "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": '25.00'
      },
    }]
  }


  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {

          res.json(payment.links[i].href);
        }
      }
    }
  });
}catch(e){
  console.log(e);
}
});


router.get('/cancel', (req, res) => res.send('Cancelled'));



router.post('/selected-address', (req, res) => {
  try{
  let user=req.session.user

  userHelpers.gettingSelectedAddress(req.body, user._id).then((selectedAddress) => {
    res.json(selectedAddress)
  })
}catch(e){
  console.log(e);
}
})






router.get('/success', (req, res) => {
  try{
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": "25.00"
      }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      console.log(JSON.stringify(payment));
  let user=req.session.user

      userHelpers.DeleteOrder(user._id).then(() => {
        res.redirect('/order-success');
      })
    }
  });
}catch(e){
  console.log(e);
  res.status(500).send(e)
}
});
// ------------------------------------------------------------VERIFY PAYMENT RAZORPAY-----------------------------------------------------------------------------

router.post('/verify-payment', (req, res) => {
  console.log('lalaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
 
try{
  let { payment } = req.body
  let { order } = req.body
  let user=req.session.user
  
  userHelpers.verifyPayment(payment, order).then(() => { 
    userHelpers.changePaymentStatus(order.receipt).then(async () => {
      userHelpers.DeleteOrder(user._id)  
      res.json({ status: true })
    })

  }).catch((err) => {   
    console.log(err);
    res.json({ status: false, errMsg: '' })

  })
}catch(e){
  console.log(e);
}
})
router.delete('/remove-payfail',(req,res)=>{
  console.log('qqqqqqqqqqqqqq');
  console.log(req.body);
  let {receipt}=req.body.orderId
  console.log('qqqqqqqqqqqqqq');


  userHelpers.removeorder(receipt)
})

// ------------------------------------------------------------RETURNED PRODUCTS--------------------------------------------------------------//
router.get('/return-product', (req, res) => {
  try{
   
  let orderId = req.query.orderid
  let productId = req.query.productid
  userHelpers.getReturnproducts(orderId, productId).then((returnedProduct) => {
    userHelpers.updateShippingStatus(orderId, productId)                 //status changing in order collection
    res.render('user/return-page', { returnedProduct, loginaano: req.session.loggedIn})
  })
}catch(e){
  console.log(e); 
}
})


router.post('/return-product', (req, res) => {
  try{
    userHelpers.ReturnproductCollectionCreation(req.body).then(() => {
    res.redirect('/order-history')
  })
}catch(e){
  console.log(e);
}
})



// -----------------------------------------------------------------------------------------------------------------------------//
router.get('/view-order-products', async (req, res) => {
  try{
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { products })
  }catch(e){
    console.log(e);
  }
})


// ------------------------------------------------0RDER SUCCESS PAGE----------------------------------------------------------------//

router.get('/order-success', (req, res) => {
  try{
  res.render('user/order-placed', { loginaano: req.session.loggedIn,wishlistCount })
  }catch(e){
    console.log(e);
  }
})

// -------------------------------------------------------------ORDER PAGE-------------------------------------------------------------------//

router.get('/order-history',verifyLogin,async(req,res)=>{

  let user=req.session.user

 let orderHistory=await userHelpers.getUserOrders(user._id)
  res.render('user/order-history',{orderHistory,loginaano: req.session.loggedIn,wishlistCount})
})


router.get('/orderDetails/:id',verifyLogin,async(req,res)=>{
  let {id}=req.params
  let user=req.session.user

  let orders=await userHelpers.getUserOrderDetail(user._id,id)
  orders.forEach(element => {
    if (element.status == "cancelled") {

      element.cancelStatus = true
    } else {
      element.cancelStatus = false

    }

  })
  orders.forEach(element => {
    if (element.status == 'Delivered') {
      element.returnStatus = true

    } else {
      element.returnStatus = false

    }
  })
 
   res.render('user/order-Details',{orders,loginaano: req.session.loggedIn,cartCount,wishlistCount})
 })




//  router.get('/order-page', verifyLogin, async (req, res) => {
//   try{
 
//   let orders = await userHelpers.productDetails(user._id)
//   orders.forEach(element => {
//     if (element.status == "cancelled") {

//       element.cancelStatus = true
//     } else {
//       element.cancelStatus = false

//     }

//   })
//   orders.forEach(element => {
//     if (element.status == 'Delivered') {
//       element.returnStatus = true

//     } else {
//       element.returnStatus = false

//     }
//   })
//   res.render('user/orders-page', { orders, loginaano: req.session.loggedIn,cartCount})
// }catch(e){
//   console.log(e);
// }
// })


// -------------------------------------------------------------WISHLIST--------------------------------------------------------------//
router.get('/wishlist/:id', verifyLogin, (req, res) => {
  try{
  let { id } = req.params
  let user=req.session.user

  userHelpers.addTowishlist(id, user._id).then(() => {
    res.redirect('/wishlist-page')
  })
}catch(e){
  console.log(e);
}
})

router.get('/wishlist-page', verifyLogin, async (req, res) => {
  try{
  let user=req.session.user

  let wishList = await userHelpers.getwishListProducts(user._id)
  res.render('user/wishlist', { wishList, loginaano: req.session.loggedIn ,wishlistCount})
  }catch(e){
    console.log(e);
  }
})


router.delete('/remove-wishlist', (req, res) => {
  try{
  
  userHelpers.removewishlistItem(req.body).then(() => {
    res.redirect('/')
  })
}catch(e){
  console.log(e);
}
})

// router.post('/remove-wishlist', (req, res) => {
//   userHelpers.removewishlistItem(req.body).then((response) => {
//     res.redirect('wishlist-page')
//   })
// })

// ----------------------------------------- product quantity change---------------------------------------------------------
router.post('/change-product-quantity',(req,res) => {
  try{
    let user=req.session.user
 
  let object = {}
  userHelpers.changeProductQuantity(req.body).then((response) => {
    object.response = response
    userHelpers.getTotalAmount(user._id).then((total) => {
      if (total[0]) {
        let Total = total[0].total
        object.total = Total
      } else {
        Total = total[0]
      }

      userHelpers.getGrandtotal(user._id).then(async(grandtotal) => {
        if (grandtotal[0]) {

          let grandTotal = grandtotal[0].grandtotal

          object.grandTotal = grandTotal
        } else {
          grandTotal = grandtotal[0]
        }
        let discounts=await userHelpers.ViewCartDiscount(user._id,grandTotal)
        object.discount=discounts[0]
        res.json(object)
      })
    })

  })
}catch(e){
  console.log(e);
}
})

// ----------------------------------------------ORDER CANCELLATION FROM USER-------------------------------------------------------------------
router.post('/cancelOrder', (req, res) => {
  try{
    console.log(';;;;;;;;;;;;;;;;;;;;;;;');
    console.log(req.body);
    console.log(';;;;;;;;;;;;;;;;;;;;;;;');
  userHelpers.cancelOrder(req.body).then((response) => {
  userHelpers.stockIncrement(req.body).then(() => {     
  res.json(response)
    })
  })
}catch(e){
  console.log(e);
}
})


// --------------------------------------------------------ACCOUNT-----------------------------------------------------------------------------
router.get('/account', verifyLogin, (req, res) => {
  try{
  res.render('user/account', { loginaano: req.session.loggedIn,wishlistCount })
  }catch(e){
    console.log(e);
  }
})

// --------------------------------------------------------CHANGE PASSWORD--------------------------------------------------------------------
router.get('/changepassword',verifyLogin, (req, res) => { 
  try{
  res.render('user/changePassword', { loginaano: req.session.loggedIn,wishlistCount })
  }catch(e){
    console.log(e);
  }
})

router.post('/changepassword', (req, res) => {
  let user=req.session.user
  userHelpers.changePassword(req.body, user._id)
  res.redirect('/acccount')
})

// -------------------------------------------------------------ADDRESS---------------------------------------------------------------------//

router.get('/show-address',verifyLogin, (req, res) => {
  let user=req.session.user
  userHelpers.getAddresscoll(user._id).then((allAddress)=>{
    res.render('user/user-address', { allAddress , loginaano: req.session.loggedIn,wishlistCount})
  })
})


router.get('/editAddress/:id', (req, res) => {
  let {id}=req.params 
  userHelpers.editingAddress(id).then((getaddress) => {
    res.render('user/edit-Address',{getaddress,loginaano: req.session.loggedIn})
  })
})


router.post("/edit-address/:id", (req, res) => {
  let {id}=req.params 
  userHelpers.editedAddress(id,req.body).then(() => {
    res.redirect('/show-address')   
  })
})



router.get('/deleteAddress/:id',(req, res) => {
  let {id}=req.params
  userHelpers.deleteSelectedAddress(id).then(() => {
   res.redirect('/show-address')
  })
})


// -----------------------------------------------------USER PROFILE-----------------------------------------------------------------------//
router.get('/profile', (req, res) => {
  let user=req.session.user
  userHelpers.getUserDetails(user._id).then((userdetails) => {
    res.render('user/user-details',{userdetails,loginaano: req.session.loggedIn,cartCount})
  })
})

router.post('/profile', (req, res) => {
  let user=req.session.user

  userHelpers.updateUserDetails(user._id, req.body).then(() => {
    res.redirect('/profile')
  })
})



module.exports = router;

