
var express = require('express');
var router = express.Router();

const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const categoryHelpers=require('../helpers/category-helpers')
const couponHelpers=require('../helpers/coupon-helpers')
const offerHelpers=require('../helpers/offer-helpers')
// const axios=require('../helpers/axios')
require('dotenv').config()


const { upload }=require ('../public/javascripts/multer')



const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin')
  }
}




const credential = {
  email:process.env.email,
  password:process.env.password
}




/*    */
router.get('/', async(req, res) => {
   try{

  if (req.session.admin) {
  
    let response=await productHelpers.getTotalSalesGraph()
    let {weeklySale,monthlySales,yearlySales}=response

   let paymentgraph=await productHelpers.paymentMethod()
   let {cod,razor,paypal}=paymentgraph
        
  productHelpers.getTotalSaleAmount().then((totalSale)=>{
  productHelpers.getUserCount().then((userCount)=>{
    res.render('admin/adminDashboard', { admin: true,weeklySale,monthlySales,yearlySales,userCount ,totalSale,cod,razor,paypal})
  })
})
  } else {
    res.render('admin/login', {admin: true,noheader:true})

  }

}catch(e){
  console.log(e)
  res.status(400).send(e)
}

})
/*  */

// router.get('/adminlogin',(req,res)=>{
//   res.render('admin/login')

// res.render('admin/login',{'loginErr':req.session.adminloginErr})
// req.session.adminloginErr=false

// })
// ------------------------------------------------------------LOGIN PAGE----------------------------------------------------------
//  router.get('/adminlogin',(req,res)=>{  
//   if(req.body.email==credential.email&&req.body.password==credential.password){     
//     req.session.admin=true
//     // productHelpers.getAllproducts().then((products)=>{
//     //   console.log(products);
//       res.redirect('/admin/dashboard')
//     // }); 
//   }else
//     res.redirect('/admin/adminlogin')
//    })

//  ------LOGIN PAGE------


//  ------------GET admin dashboard---------------

// router.get('/dashboard',verifyAdmin,function(req,res){
//   res.render('admin/adminDashboard',{admin:true,noheader:true })
// })


// IF LOGGED IN
//  ----------------------------------------------------------ADMIN DASHBOARD-------------------------------------------------------------------
router.post('/adminlogin', function (req, res) {
  try{
  if (req.body.email == credential.email && req.body.password == credential.password) {
    req.session.admin = true
    res.redirect('/admin')
  } else {
    res.redirect('/admin')
  }
}catch(e){
  console.log(e);
}
})


// ------------------------------------------------------VIEW ALLPRODUCTS-------------------------------------------------------------
router.get('/viewproducts', verifyAdmin,async function (req, res, next) {
  try{

    const page = parseInt(req.query.page) 
    const limit =7
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const results = {}
  
      let productsCount=await productHelpers.getProductsCount()
      console.log('!!!!!!!!!!!!');
      console.log(productsCount);
      console.log('!!!!!!!!!!!!');
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
    products = await productHelpers.getPaginatedResult(limit,startIndex) 
    results.pageCount =Math.ceil(parseInt(productsCount)/parseInt(limit)).toString() 
    results.pages =Array.from({length: results.pageCount}, (_, i) => i + 1)    
    results.currentPage =page.toString()  
    res.render('admin/viewProducts', { admin: true, products,results});
 
}catch(e){
  console.log(e)
  res.status(404)
}
});



// --------------------------------------------------------ADD PRODUCTS-----------------------------------------------------------------------//
router.get('/add-products', verifyAdmin, async function (req, res) {
  try{
  let cat = await categoryHelpers.getCategory()
  res.render('admin/add-product', { admin: true, cat })
}catch(e){
  console.log(e)
  res.status(404)
}
})


 router.post('/add-products',upload.array('image'),(req, res) => {
  try{

  const files = req.files
  const file = files.map((file)=>{
      return file
  })
 
  const fileName = file.map((file)=>{
      return file.filename
  })
  const product = req.body
  product.img = fileName
  console.log(product);
  stock=parseInt(product.stock)
  console.log(stock);
  product.stock=stock
  console.log(product);

productHelpers.addProduct(product).then(() => { 
    res.redirect('/admin/viewproducts')
  })

}catch(e){
  console.log(e)
  res.status(404)
}
})


// --------------------------------------- ----------------------VIEWUSER-----------------------------------------------------------------------
router.get('/viewuser',verifyAdmin,async function (req, res) {
  try{
 
    const page = parseInt(req.query.page) 
    const limit =7
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const results = {}
  
      let productsCount=await productHelpers.getUserCount()
     
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
    user = await productHelpers.getPaginatedUserResult(limit,startIndex) 
    results.pageCount =Math.ceil(parseInt(productsCount)/parseInt(limit)).toString() 
    results.pages =Array.from({length: results.pageCount}, (_, i) => i + 1)    
    results.currentPage =page.toString()
      res.render('admin/viewUser', { admin: true,user, results })

  }catch(e){
    console.log(e);
  }
})

//  ---------------------------------------------------------------BLOCKUSER------------------------------------------------------------------//
router.get('/user-block/:id', (req, res) => {
  try{

  let { id } = req.params
  userHelpers.blockUser(id).then(() => {
    res.redirect('/admin/viewUser')
  })

}catch(e){
  console.log(e);
  res.status(404)
}
})
//  -------------------------------------------------------------------UNBLOCKUSER-------------------------------------------------------------//
router.get('/user-unblock/:id', (req, res) => {
  try{

  let { id } = req.params
  userHelpers.unBlockUser(id).then(() => {
    res.redirect('/admin/viewUser')
  })

}catch(e){
  console.log(e);
  res.status(404)
}
})


// ------------------------------------------------DELETE PRODUCT----------------------------------------------------------------------------//
router.get('/delete-product/:id', (req, res) => {
  try{

  let { id } = req.params
  productHelpers.deleteProduct(id).then((response) => {
    res.redirect('/admin/viewProducts')
  })

}catch(e){
  console.log(e);
  
}
})


// ------------------------------------------------------- EDIT PRODUCT----------------------------------------------------------------------
router.get('/edit-product/:id', async (req, res) => {
  try{

  let product = await productHelpers.getProductDetails(req.params.id)
  console.log('$$$$$$$$$$$$');
  console.log(product);
  console.log('$$$$$$$$$$$$');
  let cat = await categoryHelpers.getCategory()
  res.render('admin/edit-products', { product, admin: true,cat })
}catch(e){
  console.log(e)
}
}) 

router.post('/edit-product/:id',upload.array('image'),async(req, res) => {
  try{

  let {id} = req.params
  let product = await productHelpers.getProductDetails(id)
  const file = req.files
  let filename
  req.body.img =(req.files.length!=0) ? (filename = file.map((file)=>{ return file.filename })) : product .img


  // const files = req.files
  // const file = files.map((file)=>{
  //     return file
  // })
  // const fileName = file.map((file)=>{
  //     return file.filename
  // })
  // const product = req.body
  // product.img = fileName
   stock=parseInt(product.stock)
  product.stock=stock
  productHelpers.updateProduct(id,req.body).then(() => {

      res.redirect('/admin/viewproducts')
  })

}catch(e){
  console.log(e);
}
})


//  ---------------------------------------------------LOGOUT-------------------------------------------------------------------------//
router.get('/logout', (req, res) => {
  try{ 
  req.session.admin = false
  res.redirect('/admin')
}catch(e){
  console.log(e);
}
})

// -------------------------------------------------------ADD CATEGORY-----------------------------------------------------------------//

router.get('/add-category', (req, res) => {
  try{

  res.render('admin/admin-addCategory', { admin: true })
}catch(e){
  console.log(e);
}
})


router.post('/add-category',upload.any('image'), async (req, res) => {
try{

    const files = req.files
    console.log(files);
    const file = files.map((file)=>{
        return file
    }) 
    const fileName = file.map((file)=>{
        return file.filename
    })
    const product = req.body
    product.img = fileName

    categoryHelpers.addCategory(product).then(()=>{
    res.redirect('/admin/add-category')
  })

}catch(e){
  console.log(e);
}

  })


// ---------------------------------------------------ADMIN ORDERS PAGE----------------------------------------------------------------------------
router.get('/orders',verifyAdmin, async (req, res) => {

  try{
    const page = parseInt(req.query.page) 
  const limit =7
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const results = {}

    let productsCount=await productHelpers.getOrderCount()
    console.log('!!!!!!!!!!!!');
    console.log(productsCount);
    console.log('!!!!!!!!!!!!');
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
  order = await productHelpers.getPaginatedOrderResult(limit,startIndex) 
  results.pageCount =Math.ceil(parseInt(productsCount)/parseInt(limit)).toString() 
  results.pages =Array.from({length: results.pageCount}, (_, i) => i + 1)    
  results.currentPage =page.toString()
  results.limit=limit
  res.paginatedResults = results
  res.render('admin/admin-orders', { admin: true,results,order})

}catch(e){
  console.log(e);
  }
})


// ------------------------------------------------------ADMIN PRODUCT DETAILS PAGE-----------------------------------------------------------
router.get('/product-details/:id', async (req, res) => {
  try{

  let products = await productHelpers.productDetails(req.params.id)
  products.forEach(element => {
    if( element.status=='cancelled'){
    element.cancelStatus=true
    }else{
      element.cancelStatus=false
    } 
  });
  res.render('admin/admin-ProDetails', { admin: true, products })

}catch(e){
  console.log(e);
}
})
// -------------------------------------------------UPDATE ORDER STATUS--------------------------------------------------------------
router.post('/updateOrderStatus', (req, res) => {
  try{

  productHelpers.changeDeliveryStatus(req.body)
  res.json(response)
}catch(e){
  console.log(e);
}

})

// -----------------------------------------------------VIEW RETURNED PRODUCTS-------------------------------------------------------------//

router.get('/return-page',async(req,res)=>{
  try{
  let returns= await productHelpers.getFullReturnedProducts()
 
  res.render('admin/return-page',{returns,admin:true})
  }catch(e){
    console.log(e);
  }
})



router.post('/returnProduct',async(req,res)=>{
  try{
  console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
  console.log(req.body);
  console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
  productHelpers.returnStatus(req.body).then(()=>{
    productHelpers.returnStatusInreturnColl(req.body)

    res.redirect('/admin/return-page')
  })
}catch(e){
  console.log(e);
}
})

// ------------------------------------------------COUPON IN ADMIN SIDE--------------------------------------------------------------

router.get('/coupon-page',async(req,res)=>{
  try{
 let fullCoupon=await productHelpers.getCoupons()
  res.render('admin/coupon-page',{admin:true,fullCoupon})
  }catch(e){
    console.log(e);
  }
})


router.get('/generateCoupon',(req,res)=>{ 
  try{
  res.render('admin/generate-Coupon',{admin:true})
  }catch(e){
    console.log(e);
  }
  
})


router.post('/generateCoupon',(req,res)=>{
  try{
  console.log(req.body.couponcode);
  productHelpers.createCouponCollection(req.body)
  res.redirect('/admin/coupon-page')
  }catch(e){
    console.log(e);
  }
})


router.get('/updatecoupon/:id',async(req,res)=>{
  try{
  let coupon = await couponHelpers.getCouponDetails(req.params.id)
  res.render('admin/edit-coupon',{admin:true,coupon})
  }catch(e){
    console.log(e);
  }
})
  

router.post('/updatecoupon',async(req,res)=>{
  try{
  couponid=req.body.couponid 
  let updatedCoupon = await couponHelpers.updateCouponDetails(couponid,req.body)
  res.redirect('/admin/coupon-page')
  }catch(e){
    console.log(e);
  }
})
  



router.get('/delete-coupon/:id',(req,res)=>{
  try{
  console.log(req.params.id);
  couponHelpers.deleteCoupon(req.params.id).then(()=>{
    res.redirect('/admin/coupon-page')
  })
}catch(e){
  console.log(e);
}
})

// ----------------------------------------------------------------CHART-------------------------------------------------------------------//

router.get('/chartdownload',async(req,res)=>{
  try{
  let response=await productHelpers.getTotalSalesReport()
  let {weeklySale,monthlySales,yearlySales}=response
  console.log('[[[[[[[[[[[[[[[[[[[');
  console.log(monthlySales);
  res.render('admin/admin-chart-download',{admin:true,weeklySale,monthlySales,yearlySales})
  }catch(e){
    console.log(e);
  }
})

// ----------------------------------------------------------------------OFFER-----------------------------------------------------------//
router.get('/offers',async(req,res)=>{
  try{
 let category=await categoryHelpers.getCategory()
  res.render('admin/offer',{admin:true,category})
  }catch(e){
    console.log(e);
  }
})


router.get('/generate-offer',(req,res)=>{
  try{
  res.render('admin/generate-offer',{admin:true})
  }catch(e){
    console.log(e);
  }
})


router.post('/add-categoryOffer',async(req,res)=>{
  try{
 let catfullproduct=await offerHelpers.categoryOffer(req.body)
  
  catfullproduct.forEach(element=>{
    console.log(',,,,,,,,,,,,,,,');
    console.log(element);
    console.log(',,,,,,,,,,,,,,,');
   offerHelpers.offerApplying(element)
   })
    res.redirect('/admin/offers')
  }catch(e){
    console.log(e);
  }
   })
 

router.get('/delete-offer',async(req,res)=>{
  try{
   
    console.log(req.query);
  let {categoryid}=req.query
  let {offerperc}=req.query 
  
  let deletecatoffer=await offerHelpers.deleteOffer(categoryid,offerperc)


  deletecatoffer.forEach(element=>{
    console.log(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
    console.log(element);
    console.log(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
   offerHelpers.deleteOfferinProd(element)
   })


  res.redirect('/admin/offers')
  }catch(e){
    console.log(e);
  }
})
 



router.get('/refund',(req,res)=>{
  try{
 productHelpers.getrefundProducts()
  res.render('admin/refund')
  }catch(e){
    console.log(e);
  }
})


module.exports = router;
