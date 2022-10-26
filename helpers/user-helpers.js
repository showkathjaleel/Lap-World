var db = require('../configuration/connection')
const bcrypt = require('bcrypt');
const collection = require('../configuration/collection');


var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { log } = require('console');


require('dotenv').config()



// ---------------------------------------RAZORPAY-------------------------------------
var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});

// var instance = new Razorpay({
//     key_id: 'rzp_test_NBKIQegHCsjMos',
//     key_secret: '4HYF41qsxTK81p4qJPRUj7Rx',
// });
// ---------------------------------------RAZORPAY-------------------------------------





//   const Environment=process.env.NODE_ENV==="production"
//    ?paypal.core.LiveEnvironment
//    :paypal.core.SandboxEnvironment  

//     const paypalClient =new paypal.core.PayPalHttpClient(
//    new Environment(
//     PAYPAL_CLIENT_ID,PAYPAL_CLIENT_SECRET
//     ))


// -------------------------------------------PAYPAL-------------------------------------------------------------------






module.exports = {


    // ----------------------------------------SIGNUP FUNCTION-------------------------------------------------------------------
    doSignup: async (userData) => {

        let response = {}
        response.signupstatus = false
        return new Promise(async (resolve, reject) => {
            let store = await db.get().collection('user').findOne({ email: userData.email })
            if (store) {   //if that e-mail is there ,dont enter him           
                response.signuperr = true
                resolve(response)
            }
            else {
                userData.password = userData.password.toString();
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection('user').insertOne(userData).then((data) => {
                    response.signuperr = false
                    response.signupstatus = true
                    response.userData = userData
                    resolve(response)
                })
            }
        })
    },

    // -------------------------------------------------------------CHANGEPASSWORD-----------------------------------------------------------------//
    changePassword: (twoPasswords, userId) => {

        let response = {}

        return new Promise(async (resolve, reject) => {
            let userCheck = await db.get().collection('user').findOne({ _id: objectId(userId) })

            if (userCheck) {
                twoPasswords.password = twoPasswords.password.toString();
                twoPasswords.pass = await bcrypt.hash(twoPasswords.password, 10)
                bcrypt.compare(twoPasswords.password, userCheck.password).then(async (status) => {
                    if (status) {
                        twoPasswords.newpass = await bcrypt.hash(twoPasswords.newpass, 10)
                        // return new Promise((resolve, reject) => {
                        db.get().collection('user').updateOne
                            ({ _id: objectId(userId) }, { $set: { password: twoPasswords.newpass } })
                        // response.user = user
                        response.status = true
                        resolve(response)
                        // })
                    } else {

                        response.error = 'Invalid  password'
                        resolve(response)
                    }
                })
            }

        })

    },


    // ----------------------------------------------------------------- DISPLAYING USER IN ADMIN PAGE ----------------------------
    getFullusers: () => {
        return new Promise(async (resolve, reject) => {
            allusers = await db.get().collection('user').find().toArray()
            resolve(allusers)
        })
    },

    // -----------------------------------------------------------------ADMIN BLOCKING USER -------------------------------------------
    blockUser: (objId) => {
        id = objectId(objId)
        return new Promise(async (resolve, reject) => {
            block = await db.get().collection('user')
                .updateOne({ _id: id }, { $set: { signupstatus: false } })
            resolve()
        })
    },

    // -----------------------------------------------------------------ADMIN UNBLOCKING USER -------------------------------------------

    unBlockUser: (objId) => {
        id = objectId(objId)
        return new Promise(async (resolve, reject) => {
            unBlock = await db.get().collection('user')
                .updateOne({ _id: id }, { $set: { signupstatus: true } })
            resolve()
        })
    },
    // -----------------------------------------------------------------CHECKING USER IS  BLOCKED OR NOT-------------------------------
    AddStatus: (userData) => {
        return new Promise(async (resolve, reject) => {
            unBlock = await db.get().collection('user')
                .updateOne({ email: userData.email }, { $set: { signupstatus: true } })
            resolve()
        })
    },

    // -----------------------------------------------------------------CHECKING MOBILE NUMBER EXISTS---------------------------------------------------

    mobileOtp: (userData) => {

        let response = {}
        return new Promise(async (resolve, reject) => {
            let mob = userData.number
            user = await db.get().collection('user').findOne({ number: mob })

            if (user) {
                response.user = user
                resolve(response)
            }
            else {
                reject('ERROR')
            }
        })
    },

    // -----------------------------------------------------------------LOGIN FUNCTION---------------------------------------------------

    dologin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}


            let user = await db.get().collection('user').findOne({ email: userData.email })


            if (user) {
                if (user.signupstatus) {
                    response.blockedUser = false
                    bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {

                            response.user = user
                            response.status = true

                            resolve(response)
                        } else {
                            response.status = false
                            response.error = 'Invalid  password'
                            resolve(response)
                        }
                    })
                } else {
                    response.blockedUser = true
                    response.status = false
                    response.error = 'You are Blocked'
                    resolve(response)
                }
            } else {
                response.status = false
                response.error = 'Invalid Email'
                resolve(response)
            }
        })
    },
    // ---------------------------------------------------------ADD ING PRODUCTS TO CART-----------------------------------------------------
    // ---------if there is a cart update in that cart, else create a ew cart   
    addtocart: (productid, userId) => {




        let productObj = {
            item: objectId(productid),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection('cart').findOne({ user: objectId(userId) })

            if (userCart) {
                let productExist = userCart.products.findIndex(product => product.item == productid)

                if (productExist != -1) {
                    db.get().collection('cart').updateOne({ user: objectId(userId), 'products.item': objectId(productid) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()
                    })

                }
                else {

                    db.get().collection('cart').updateOne({ user: objectId(userId) },
                        {
                            $push: { products: productObj }
                        }
                    ).then(() => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [productObj]
                }

                db.get().collection('cart').insertOne(cartObj).then(() => {
                    resolve()
                })
            }
        })
    },

    // ------------------------------------------------------------------------------------------------------------------------------------

    cartDetails: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cartDetails = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cartDetails)
        })
    },


    // ---------------------------------------------------------CartPage il add cheytha products details kanan------------------------------

    getCartProducts: (userId) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection('cart').aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $addFields: {
                        convertPrice: { $toInt: "$product.Price" }
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: 1, total: { $multiply: ['$quantity', '$convertPrice'] }
                    }
                },
            ]).toArray()
            resolve(cartItems)

        })
    },











    // ---------------------------------------------------------------------CART PAGE-------------------------------------------------------------//


    getCartProductsinCart: (userId) => {
        // let response = {}
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection('cart').aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $addFields: {
                        convertPrice: { $toInt: "$product.Price" }
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: 1, total: { $multiply: ['$quantity', '$convertPrice'] }
                    }
                },
            ]).toArray()

            // response.cartItems = cartItems
            resolve(cartItems)
        })
    },





    ViewCartDiscount: (userId, total) => {
        let tot = parseInt(total)

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).aggregate(
                [
                    { $match: { user: objectId(userId) } },


                    {
                        $lookup:
                        {
                            from: collection.USER_COLLECTION,
                            localField: "user",
                            foreignField: "_id",
                            as: "usrdetails"
                        }
                    },
                    {
                        $project: { userdetails: { $arrayElemAt: ["$usrdetails", 0] } }
                    },
                    {
                        $lookup:
                        {
                            from: collection.COUPON_COLLECTION,
                            localField: "userdetails.couponid",
                            foreignField: "_id",
                            as: "Coupondetails"
                        }
                    },
                    {
                        $project: { Coupondetail: { $arrayElemAt: ["$Coupondetails", 0] }, userdetails: 1 }
                    },
                    {
                        $project: {
                            discountedPrice: { $round: [{ $multiply: [{ $divide: ["$Coupondetail.couponvalue", 100] }, tot] }, 0] },
                            userdetails: 1,
                            Coupondetails: 1
                        }
                    },
                    {
                        $project: {
                            TotalAfterDiscount: { $subtract: [tot, '$discountedPrice'] },
                            discountedPrice: 1,
                            Coupondetails: 1
                        }
                    },
                ]).toArray().then((find) => {


                    resolve(find)
                })

        })
    },



    // -------------------------------------------------------COUPON USING--------------------------------------------------------------


    couponUsing: (userId) => {


        return new Promise(async (resolve, reject) => {

            let offerPrice = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },

                {
                    $lookup: {
                        from: collection.USED_COUPON_COLLECTION,
                        localField: 'userId',          //cart collection il userid=user
                        foreignField: 'user',       //coupon collection il userid=user
                        as: 'offer'
                    }
                },
                {
                    $unwind: '$offer'
                },
                {
                    $sort: {
                        _id: -1
                    }
                },
                {
                    $limit: 1
                },
                {
                    $project: {
                        percentage: '$offer.discount',
                        discountedPrice: '$offer.discountPrice',
                    }
                }


            ]).toArray()

            resolve(offerPrice)
        })

    },

    // ----------------------------------------------------------CHECKING COUPON IS VALID OR NOT------------------------------------------------
    couponCheck: ({ couponcode }, grandTotal, userid) => {
        let response = {}

        return new Promise(async (resolve, reject) => {
            let discount = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponcode: couponcode })
            couponValue = discount.couponvalue
            couponValue = parseInt(couponValue)
            discount.couponvalue = couponValue


            if (discount) {
                response.findCoupon = true
                const nowDate = new Date();


                if (nowDate > discount.todate) {
                    response.expired = true
                    response.errMessage = 'Coupon is expired'

                    resolve(response)
                    // res.json({error:'Coupon is expired'})

                }
                else {

                    response.expired = false

                    let isCouponused = await db.get().collection(collection.USED_COUPON_COLLECTION).findOne({ userId: userid, couponId: discount._id })

                    if (isCouponused) {
                        response.alreadyUsed = true
                        response.errMessage = 'Coupon Already Used'
                        resolve(response)
                    }


                    else {
                        response.alreadyUsed = false
                        discountPrice = (grandTotal * discount.couponvalue) / 100;
                        let couponPrice = grandTotal - discountPrice                       //subtotal aan couponPrice

                        let usedCouponObj = {
                            userId: userid,
                            couponcode: couponcode,
                            date: new Date(),
                            discount: discountPrice,
                            discountPrice: couponPrice,
                            couponId: discount._id
                        }
                        db.get().collection(collection.USED_COUPON_COLLECTION).insertOne(usedCouponObj).then(() => {
                            response.couponPrice = couponPrice
                            response.discountPrice = discountPrice

                            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userid) }, { $set: { couponid: discount._id } }, { upsert: true })
                            resolve(response)
                        })
                    }


                }

            } else {
                response.findCoupon = false
                response.errMessage = 'No coupon in this code'
                resolve(response)

            }


        })
    },

    // ------------------------------------------DELETE COUPON IN CART---------------------------------------------------------------

    deleteCoupon: (userid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userid) }).then((user) => {
                let couponId = user.couponid
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userid) }, { $unset: { couponid: couponId } })
                db.get().collection(collection.USED_COUPON_COLLECTION).findOne({ couponId: couponId }).then((deletingcoupon) => {
                    db.get().collection(collection.USED_COUPON_COLLECTION).deleteOne({ _id: deletingcoupon._id }).then((data) => {

                    })
                })
            })
        })
    },


    // ----------------------------------------TO GET COUNT IN CART------------------------------------------------------
    getCartCount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection('cart').findOne({ user: objectId(userid) })
            if (cart) {
                count = cart.products.length;
            }
            resolve(count)
        })
    },
    // -------------------------------------------TO DELETE PRODUCTS IN CART-----------------------------------------------------

    removecartItem: (cart) => {
        return new Promise(async (resolve, reject) => {
            cartId = cart.cart;
            proId = cart.product;

            let product = await db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(cartId) },
                {
                    $pull: { products: { item: objectId(proId) } }

                }
            )
            resolve(product)
        })

    },


    // ---------------------------------------------------------------------------------------------------------------------------------
    // changeProductQuantity: (details) => {
    //     let response = {}
    //     details.count = parseInt(details.count)
    //     details.qty = parseInt(details.qty)

    //     return new Promise((resolve, reject) => {

    //         if (details.count == -1 && details.qty == 1) {
    //             db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
    //                 {
    //                     $pull: { products: { item: objectId(details.product) } }
    //                 }
    //             ).then((response) => {
    //                 resolve(false)
    //             })
    //         } else {

    //             db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
    //                 {
    //                     $inc: { 'products.$.quantity': details.count }
    //                 }
    //             ).then((response) => {
    //                 resolve(true)
    //             })
    //         }
    //     })
    // },


    changeProductQuantity: (details) => {
        let response = {}
        details.count = parseInt(details.count)
        details.qty = parseInt(details.qty)

        return new Promise(async (resolve, reject) => {

            if (details.count == -1 && details.qty == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve(false)
                })
            }
            else {
                //    let stockChecking=await
                db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: {
                            _id: objectId(details.cart)


                        }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $match: {
                            'products.item': objectId(details.product)

                        }
                    },

                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'

                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ['$product', 0] }

                        }
                    },
                    {
                        $project: {
                            quantity: 1,
                            stock: '$product.stock'
                        }
                    }
                ]).toArray().then((data) => {
                    let signOfCount = Math.sign(details.count)
                    if (data[0].stock > data[0].quantity) {

                        db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                            {
                                $inc: { 'products.$.quantity': details.count }
                            }
                        ).then((response) => {

                            resolve(true)
                        })

                    } else if (signOfCount == -1 && data[0].stock == data[0].quantity) {

                        db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                            {
                                $inc: { 'products.$.quantity': details.count }
                            }
                        ).then((response) => {

                            resolve(true)
                        })

                    } else {
                        resolve(false)

                    }
                })
            }

        })
    },



    // changeProductQuantity: (details) => {
    //     let response = {}
    //   
    //     details.count = parseInt(details.count)
    //     details.qty = parseInt(details.qty)

    //     return new Promise(async(resolve, reject) => {

    //         if (details.count == -1 && details.qty == 1) {
    //             db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cartId) },
    //                 {
    //                     $pull: { products: { item: objectId(details.productId) } }
    //                 }
    //             ).then((response) => {
    //                 resolve(false)
    //             })
    //         }
    //          else
    //          {
    //         //    let stockChecking=await
    //             db.get().collection(collection.CART_COLLECTION).aggregate([
    //             {   
    //                 $match:{
    //                     _id:objectId(details.cartId) 


    //               }                   
    //             },
    //             {
    //                 $unwind:'$products'
    //             },
    //             {   
    //                 $match:{
    //                     'products.item':objectId(details.productId) 

    //               }                   
    //             },

    //             {
    //                 $project:{
    //                     item:'$products.item',
    //                     quantity:'$products.quantity'

    //                 }
    //             },
    //             {
    //                 $lookup:{
    //                     from:collection.PRODUCT_COLLECTION,
    //                     localField:'item',
    //                     foreignField:'_id',
    //                     as:'product'
    //                 }
    //             },
    //             {
    //                 $project:{
    //                     item:1,
    //                     quantity:1,
    //                     product: { $arrayElemAt: ['$product', 0]}

    //                 }
    //             },
    //             {
    //                 $project:{
    //                     quantity:1,
    //                     stock:'$product.stock'
    //                 }
    //             }                 
    //             ]).toArray().then((data)=>{
    //              
    //                 let signOfCount=Math.sign(details.count)
    //                 if(data[0].stock>data[0].quantity){

    //                     db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
    //                     {
    //                         $inc: { 'products.$.quantity': details.count }
    //                     }
    //                 ).then((response) => {

    //                     resolve(true)
    //                 })

    //                 }else if(signOfCount==-1&&data[0].stock==data[0].quantity){

    //                     db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
    //                     {
    //                         $inc: { 'products.$.quantity': details.count }
    //                     }
    //                 ).then((response) => {

    //                     resolve(true)
    //                 })

    //                 }else{
    //                     resolve(false)

    //                 }
    //             })
    //        }

    //     })
    // },









    getTotalAmount: (userId) => {

        return new Promise((resolve, reject) => {
            db.get().collection('cart').aggregate([

                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {

                    $addFields: {
                        convertPrice: { $toInt: "$product.Price" }

                    }
                },

                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$convertPrice'] } }

                    }
                },

                {
                    $project: {
                        total: 1, _id: 0
                    }
                }

            ]).toArray().then((total) => {
                resolve(total)
            })

        })
    },
    getGrandtotal: (userId) => {

        return new Promise((resolve, reject) => {
            db.get().collection('cart').aggregate([

                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {

                    $addFields: {
                        convertPrice: { $toInt: "$product.Price" }
                    }
                },

                {
                    $project: {

                        total: { $multiply: ['$quantity', '$convertPrice'] }, item: 1, quantity: 1, product: 1
                    }
                },

                {
                    $group: {
                        _id: null,
                        grandtotal: { $sum: '$total' }
                    }
                },

            ]).toArray().then((grandtotal) => {
                resolve(grandtotal)
            })

        })


    },
    // -----------------------------------order page il orders okke kittan vendi---------------------
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).find({ user: objectId(userId) }).sort({ _id: -1 }).toArray()
            resolve(order)
        })
    },

    getUserOrderDetail: (userid, orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderdetail = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        status: '$products.status',
                        discountedPrice: 1,
                        totalAmount: 1

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        discountedPrice: 1, totalAmount: 1, status: 1, item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
            ]).toArray()
            console.log('@@@@@@@@@@@@@@@@@@@@@');
            console.log(orderdetail);
            console.log('@@@@@@@@@@@@@@@@@@@@@');
            resolve(orderdetail)

        })

    },


    productDetails: (userId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        status: '$products.status',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        status: 1, item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $addFields: {
                        convertPrice: { $toInt: "$product.Price" }
                    }
                },
                {
                    $project: {

                        total: { $multiply: ['$quantity', '$convertPrice'] }, status: 1, quantity: 1, product: 1
                    }
                }
            ]).toArray().then((response) => {
                console.log('------------------------');
                console.log(response);
                console.log('------------------------');
                resolve(response)
            })
        })
    },

    // ---------------------------------------------------------- TO SEE ORDERED ITEMS----------------------------------------------//
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { user: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $addFields: {
                        convertPrice: { $toInt: "$product.Price" }
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
            ]).toArray()
            resolve(orderItems)
        })
    },

    // -----------------------------------------------------ORDER COLLECTION CREATION--------------------------------------------------------------//

    placeOrder: (order, userId, cartItems, total, discount) => {

        let orderObj;
        let addressObj;
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        newdate = year + "/" + month + "/" + day;
        orderMonth = month + "/" + year

        return new Promise(async (resolve, reject) => {
            let status = order.paymentMethod === 'COD' ? 'placed' : 'pending'

            if (discount.discountedPrice) {

                orderObj = {
                    deliverydetails: {
                       

                        name: order.firstname,
                        lastname: order.lastname,
                        email: order.email,
                        mobile: order.phone,


                        houseAddress: {
                            streetaddress: order.streetaddress,
                            landmark: order.landmark,
                            city: order.city,
                            pincode: order.postcode,
                            state: order.state,
                            country: order.country,
                        }
                    },

                    cartEach: cartItems.products.forEach(cartProd => {            //this status is for knowing product shipped  or not
                        cartProd.status = order.status
                    }),

                    user: objectId(userId),
                    paymentMethod: order.paymentMethod,
                    products: cartItems.products,
                    discountedPrice: discount.discountedPrice,
                    totalAmount: discount.TotalAfterDiscount,
                    status: status,            //this status is for knowing money payed or not
                    date: newdate,
                    orderMonth: orderMonth,
                    orderYear: year

                }

                addressObj = {}
                addressObj.address = orderObj.deliverydetails
                addressObj.userId = objectId(userId)

                
            } else {
                orderObj = {
                    deliverydetails: {

                        name: order.firstname,
                        lastname: order.lastname,
                        email: order.email,
                        mobile: order.phone,


                        houseAddress: {
                            streetaddress: order.streetaddress,
                            landmark: order.landmark,
                            city: order.city,
                            pincode: order.postcode,
                            state: order.state,
                            country: order.country,
                        }
                    },

                    cartEach: cartItems.products.forEach(cartProd => {            //this status is for knowing product shipped  or not
                        cartProd.status = order.status
                    }),

                    user: objectId(userId),
                    paymentMethod: order.paymentMethod,
                    products: cartItems.products,
                    totalAmount: total,
                    discountedPrice: '0',
                    status: status,            //this status is for knowing money payed or not
                    date: newdate,
                    orderMonth: orderMonth,
                    orderYear: year

                }

                addressObj = {}
                addressObj.address = orderObj.deliverydetails
                addressObj.userId = objectId(userId)


            }
           
                db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                    // obj.orderId=response.insertedId

                    // -----------------------------------------------------------now added----
                    db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addressObj)


                    if (orderObj.paymentMethod == 'COD') {
                        db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) })
                    }



                    db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {


                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $unset: { couponid: user.couponid } })








                        db.get().collection(collection.ORDER_COLLECTION).aggregate([

                            {
                                $match: {
                                    _id: response.insertedId
                                }
                            },


                            {
                                $unwind: '$products'
                            },
                            {
                                $project: {
                                    item: "$products.item",
                                    quantity: "$products.quantity"
                                }
                            }
                        ]).toArray().then((response) => {

                            resolve(response)


                        })



                    })
                })
            
        })


    },



    // -------THINGS SEE IN ORDER PAGE-------------------------------------
    decrementStock: (element) => {
        console.log(element);
        console.log(element.quantity)

        console.log(typeof (element.quantity))


        return new Promise((resolve, reject) => {
            console.log("its entering oh yeah")
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                { _id: objectId(element.item) }, { $inc: { stock: -element.quantity } }

            )
        })

    },

    // -----------------------------------------------------------PAYPAL PAYMENT---------------------------------------------------------------------
    generatePaypal: (orderId, amount) => {
        return new Promise((resolve, reject) => {


            var create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "LAP world",
                            "sku": orderId,
                            "price": amount,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": amount
                    },
                    "description": "Hat for the best team ever"
                }]
            };


            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    for (let i = 0; i < payment.links.length; i++) {
                        if (payment.links[i].rel === 'approval_url') {
                            resolve(payment.links[i].href)


                        }
                    }
                }
            })
        })
    },



    // --------------------------------------------------------------------GETTING ADDRESS OF USER----------------------------------------------re

    getAddresscoll: (userid) => {
        console.log(userid);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).aggregate([
                {
                    $match: {
                        userId: objectId(userid)

                    }
                },
                // {
                //     $project:{
                //         name:'$address.name',
                //         lastname:'$address.lastname',
                //         email:'$address.email',
                //         mobile:'$address.mobile',
                //          useraddress: { $arrayElemAt: ['$houseAddress', 0] }

                //     }
                // }
            ]).toArray().then((addr) => {
                console.log('--------------');
                console.log(addr);
                console.log('--------------');
                resolve(addr)
            })
        })
    },
















    getAddress: (userid) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).aggregate(
                [
                    {
                        $match: {
                            userId: objectId(userid)
                        }
                    },
                    {
                        $group: {
                            _id: '$address',
                        }
                    }
                ]).toArray().then((address) => {
                    console.log('#################################################################################################');
                    resolve(address)
                    console.log('#################################################################################################');
                })
        })
    },


    gettingSelectedAddress: (customerdetails, userid) => {
        customerName = customerdetails.customerName
        customeraddress = customerdetails.customeraddress


        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [
                            { userId: objectId(userid) },
                            { 'address.name': customerName },
                            { 'address.houseAddress.streetaddress': customeraddress }
                        ]
                    }
                },
                {
                    $group: {
                        _id: "$address"

                    }
                }
            ]).toArray().then((response) => {

                resolve(response)
            })
        })


    },

    deleteSelectedAddress: (id) => {
        console.log('addressid');
        console.log(id);
        console.log('addressid');

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({ _id: (objectId(id)) }).then(() => {
                resolve()

            })
        })
    },


    //     return new Promise((resolve, reject) => {
    //         db.get().collection(collection.ADDRESS_COLLECTION).deleteMany(
    //             {

    //                 $and: [
    //                     { userId: objectId(userid) },
    //                     { 'address.name': customerName },
    //                     { 'address.houseAddress.streetaddress': customeraddress }
    //                 ]

    //             }

    //         ).then((response) => {

    //             resolve(response)

    //         })
    //     })
    // },



    getUserDetails: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection('user').findOne({ _id: objectId(userId) }).then((user) => {
                resolve(user)

            })
        })
    },
    updateUserDetails: (userId, userDetails) => {

        return new Promise((resolve, reject) => {
            db.get().collection('user').updateOne({ _id: objectId(userId) }, {
                $set: {
                    name: userDetails.name,
                    email: userDetails.email,
                    number: userDetails.number
                }
            }).then(() => {
                resolve()

            })
        })
    },

    editingAddress: (addressId) => {
        console.log(')))))))))))');
        console.log(addressId);

        return new Promise(async (resolve, reject) => {
            let Address = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objectId(addressId) })
            resolve(Address)
            //                 {
            //                 $match:{  $and:
            // [{ userId: objectId(userId) }, { 'address.name': name },{ 'address.houseAddress.streetaddress': address  }]
            //                 }
            //                 ]).then().toArray()
            //                 console.log('????????????');
            //                 console.log(Address);
            //                 console.log('????????????');
            //                 resolve(Address)
            //             })
        })
    },



    editedAddress: (addressId, editedAddress) => {
        console.log('hihihihihihihihihihiihhihihi');
        console.log(addressId);
        console.log(editedAddress);
        console.log('hihihihihihihihihihiihhihihi');
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: objectId(addressId) },
                {
                    $set: {



                        // --------------------------ippol add cheyyunnath--------------------------------------------

                        'address.name': editedAddress.firstname,
                        'address.lastname': editedAddress.lastname,
                        'address.email': editedAddress.email,
                        'address.mobile': editedAddress.phone,



                        'address.houseAddress.streetaddress': editedAddress.streetaddress,
                        'address.houseAddress.landmark': editedAddress.landmark,
                        'address.houseAddress.city': editedAddress.city,
                        'address.houseAddress.pincode': editedAddress.postcode,
                        'address.houseAddress.state': editedAddress.state,
                        'address.houseAddress.country': editedAddress.country,
                    }



                }).then(() => {
                    resolve()
                })

        })

    },
    // ----------------------------------------------------RAZORPAY PAYMENT-------------------------------------------------------------//
    generateRazorpay: (orderId, amount, discount) => {
        let disc = discount.TotalAfterDiscount
        discount.TotalAfterDiscount = parseInt(disc)
        console.log('pppppppppppppppp');
        console.log(discount);
        console.log(discount.TotalAfterDiscount);
        console.log(typeof (discount.TotalAfterDiscount));
        return new Promise((resolve, reject) => {
            if (discount.TotalAfterDiscount) {
                console.log('kkkkkkkkkkkkkkkkkkkkkkkkk');
                var options = {
                    amount: (discount.TotalAfterDiscount * 10),
                    currency: "INR",
                    receipt: "" + orderId
                };
                instance.orders.create(options, function (err, order) {
                    if (err) {
                    }
                    else {
                        resolve(order)
                    }


                });
            } else {

                var options = {
                    amount: amount,  // amount in the smallest currency unit
                    currency: "INR",
                    receipt: "" + orderId
                };
                instance.orders.create(options, function (err, order) {
                    if (err) {
                    }
                    else {
                        resolve(order)
                    }


                });

            }

        })
    },

    verifyPayment: (payment, order) => {




        return new Promise((resolve, reject) => {

            var crypto = require("crypto");
            var expectedSignature = crypto.createHmac('sha256', '4HYF41qsxTK81p4qJPRUj7Rx')
                .update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id)
                .digest('hex');


            if (expectedSignature == payment.razorpay_signature) {
                resolve()
            } else {
                reject(err)
            }


        })
    },

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }
            ).then(() => {
                resolve()
            })
        })
    },
    DeleteOrder: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) }).then(() => {
                resolve()
            })

        })
    },




    //  --------------------------------------------------------ORDER CANCELLATION FROM USER----------------------------------------------------------//

    cancelOrder: ({ cart, product, qty }) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne
                ({
                    _id: objectId(cart),
                    "products": { $elemMatch: { "item": objectId(product) } }
                },
                    {
                        $set: { "products.$.status": 'cancelled' }
                    }).then((response) => {
                        resolve(response)
                    })
        })



    },

    stockIncrement: ({ cart, product, qty }) => {
        qty = parseInt(qty)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product) },
                { $inc: { stock: qty } }).then(() => {
                    resolve()
                })

        })

    },







    incrementStock: ({ cart, product }) => {


        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                { _id: element.item }, { $inc: { stock: +element.quantity } }

            )

        })
    },

    //  { _id:element.item },{$inc:{stock:-element.quantity}}


    // -----------------------------------------------------------------CATEGORY-----------------------------------------------------------------//
    addCategory: (data) => {



        return new Promise(async (resolve, reject) => {







            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: 'category' }).then((management) => {

                if (management) {
                    if (data.Category) {
                        db.get().collection(collection.CATEGORY_COLLECTION)
                            .updateOne({ name: 'category' },
                                {
                                    $addToSet: { category: data.Category }
                                }
                            ).then((response) => {
                                resolve()
                            })
                    } else {
                        db.get().collection(collection.CATEGORY_COLLECTION)
                            .updateOne({ name: 'category' },
                                {
                                    $addToSet: { brand: data.brand }
                                }
                            ).then((response) => {
                                resolve()
                            })
                    }

                } else {

                    let category = {
                        name: 'category',
                        category: [data.Category]
                    }
                    db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((response) => {
                        resolve()
                    })
                }
            })

        })

    },




    // ----------------------------------------------------PAGINATIONS -----------------------------------------------------------------

    paginatedProducts: (query) => {
        query = parseInt(query)
        let limit = 4


        return new Promise(async (resolve, reject) => {

            let products = await db.get().collection('product').find()
                .limit(limit).skip(skip).toArray()

            resolve(products)
        })
    },





    // --------------------------------------------------------------ADD TO WISHLIST------------------------------------------------------------
    addTowishlist: (productid, userId,) => {



        let productObj = {
            item: objectId(productid),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })



            if (userCart) {
                let productExist = userCart.products.findIndex(product => product.item == productid)


                if (productExist != -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(productid) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()
                    })

                }
                else {

                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: productObj }
                        }
                    ).then(() => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [productObj]
                }

                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(cartObj).then(() => {

                    resolve()
                })
            }
        })

    },


    getwishListProducts: (userId) => {

        return new Promise(async (resolve, reject) => {
            let wishItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product',                   //ivide namukk enth venelum odkkam.eth key value lekkan varendath.
                    }
                },
                {
                    $project: {
                        _id: 1, user: 1, products: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },

            ]).toArray()

            resolve(wishItems)
        })
    },



    removewishlistItem: (cart) => {
        return new Promise(async (resolve, reject) => {

            cartId = cart.userid;
            proId = cart.productid;

            let product = await db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: objectId(cartId) },
                {
                    $pull: { products: { item: objectId(proId) } }

                }
            )
            resolve()
        })

    },




    // removewishlistItem: (cart) => {
    //     return new Promise(async (resolve, reject) => {
    //         cartId = cart.cart;
    //         proId = cart.product;

    //         let product = await db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: objectId(cartId) },
    //             {
    //                 $pull: { products: { item: objectId(proId) } }

    //             }
    //         )
    //         resolve(product)
    //     })

    // },



    // ----------------------------------------------------------------RETURN PRODUCTS----------------------------------------------------------//
    getReturnproducts: (orderId, productId) => {


        return new Promise((resolve, reject) => {

            db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:
                    {
                        _id: objectId(orderId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $match:
                    {
                        'products.item': objectId(productId)
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }

                },
                {
                    $project: {
                        products: 1, deliverydetails: 1, totalAmount: 1, date: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },

            ]).toArray().then((orderDetails) => {
                resolve(orderDetails)

            })
        })

    },



    ReturnproductCollectionCreation: (returnDetails) => {
        let orderId = objectId(returnDetails.orderId)
        returnDetails.orderId = orderId

        let productId = objectId(returnDetails.productId)
        returnDetails.productId = productId
        return new Promise((resolve, reject) => {
            db.get().collection(collection.RETURN_COLLECTION).insertOne(returnDetails).then(() => {
                resolve()
            })

        })

    },





    updateShippingStatus: (orderId, productId) => {



        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne
                ({
                    _id: objectId(orderId),
                    "products": { $elemMatch: { "item": objectId(productId) } }
                },
                    {
                        $set: { "products.$.status": 'Return-requested' }
                    }).then((response) => {
                        resolve(response)
                    })
        })
    },

    wishlistCount: (userid) => {

        let count = 0;
        return new Promise(async (resolve, reject) => {
            let wishcount = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userid) })
            if (wishcount) {
                count = wishcount.products.length;
            }
            resolve(count)

        })
    }

}












