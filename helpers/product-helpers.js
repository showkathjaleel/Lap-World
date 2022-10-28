
const collection = require('../configuration/collection');
var db=require('../configuration/connection')

var objectId=require('mongodb').ObjectId



module.exports={
    addProduct:(product)=>{
        let Brand= product.brandname
        product.brandname=objectId(Brand)

        let price=product.Price
        product.Price=parseInt(price)

        let offer=product.Offers
        product.Offers=parseInt(offer)
        
        let stock=product.stock
        product.stock=parseInt(stock)
         
        // if(product.Offers){
        //    product.productOfferdeductdPrice=Math.ceil((product.Price*product.Offers)/100)
        //    product.productOfferPrice=product.Price-product.productOfferdeductdPrice
        // }
          
        return new Promise(async(resolve,reject)=>{    
        db.get().collection('product').insertOne(product).then((data)=>{           
            resolve(data.insertedId)
        })
    })
    },


getAllproducts:()=>{
    return new Promise(async(resolve,reject)=>{
        let products=await db.get().collection('product').find().toArray()
        resolve(products)
    })
},


deleteProduct:(id)=>{
    return new Promise((resolve,reject)=>{
       
          db.get().collection('product').deleteOne({_id:objectId(id)}).then((response)=>{
            resolve(response)
        })
    })
},


getProductDetails:(id)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection('product').findOne({_id:objectId(id)}).then((product)=>{
            resolve(product)
           
        })
    })
 },


 updateProduct:(id,ProDetails)=>{

    Category=ProDetails.category
    ProDetails.category=objectId(Category)

   let price=ProDetails.Price
   ProDetails.Price=parseInt(price)
  
   let offer=ProDetails.Offers
   ProDetails.Offers=parseInt(offer)

   let stock=ProDetails.stock
   ProDetails.stock=parseInt(stock)

//    if(ProDetails.Offers){
//     ProDetails.productOfferdeductdPrice=(ProDetails.Price*ProDetails.Offers)/100
//     ProDetails.productOfferPrice=ProDetails.Price-ProDetails.productOfferdeductdPrice
//  }
 
    return new Promise((resolve,reject)=>{
        db.get().collection('product').updateOne({_id:objectId(id)},{$set:{
            laptops:ProDetails.laptops,
            Price:ProDetails.Price,
            Offers:ProDetails.Offers,
           description:ProDetails.description,
           Specs:ProDetails.Specs,
           brandname:ProDetails.category, 
           stock:ProDetails.stock,
        //    productOffer:ProDetails.productOfferPrice,
           img:ProDetails.img
       
        }
    },{upsert:true}).then((response)=>{
        resolve()

    })
    })
},



getOrderCount:()=>{
    return new Promise(async(resolve,reject)=>{
     let count=await db.get().collection(collection.ORDER_COLLECTION).find().count()
     resolve(count)
    })
},



getPaginatedOrderResult:(limit,startIndex)=>{      
        return new Promise(async (resolve, reject) => {
         let order = await db.get().collection(collection.ORDER_COLLECTION).find().limit(limit).skip(startIndex).toArray()               
            resolve(order)
        })
},



getOrderedProducts:()=>{
    return new Promise((resolve,reject)=>{  
         db.get().collection(collection.ORDER_COLLECTION).find().toArray().then((response)=>{
                resolve (response)          
            })
        })
},



productDetails:(orderId)=>{  
    return new Promise((resolve, reject) => {
        db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match: {_id: objectId(orderId)}
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity',
                    status:'$products.status',
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
                    status:1,item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
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
            resolve(response)
        })
    })
},


changeDeliveryStatus:(details)=>{
 let status=details.status
 let orderId=details.orderId
 let productId=details.ProductId
   
    return new Promise((resolve,reject)=>{
    db.get().collection(collection.ORDER_COLLECTION).updateOne
    ({_id:objectId(orderId),
        "products":{$elemMatch:{"item":objectId(productId)}}},
        {$set:{"products.$.status":status}
    }).then((response)=>{
        resolve(response)
    })
})

},

getCategory:()=>{
    return new Promise(async(resolve,reject)=>{
             let categories = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({name:'category'})
             resolve(categories)
       
})
},

// --------------------------------------------------RTURNED PRODUCT PAGE IN ADMIN-------------------------------------------------------

getFullReturnedProducts:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.RETURN_COLLECTION).aggregate([
        {
            $lookup:{
                from:collection.ORDER_COLLECTION,
                localField:'orderId',
                foreignField:'_id',
                as:'return'

            }

        }, 
        {
            $project:{
               refund:1,complaint:1,orderStatus:1,Discription:1, return: { $arrayElemAt: ['$return', 0] }

            }
        },
        {
            $unwind:'$return.products'
        },
        {
            $match:{
                'return.products.status':{$in:['Return-requested','Return-approved']} 
            }
        },
        {
            $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'return.products.item',
                foreignField:'_id',
                as:'return-products'
            }

        },
        {
            $project:{
                refund:1,complaint:1,Discription:1,orderStatus:1,return:1,returnProducts:{$arrayElemAt:['$return-products',0]}
            }
        }

    ]).toArray().then((returnedOrders)=>{
        resolve(returnedOrders)
    })
    })

},


returnStatus:(returnDetails)=>{
  
    let orderId=objectId(returnDetails.orderId)
    returnDetails.orderId=orderId

    let productId=objectId(returnDetails.productId)
    returnDetails.productId=productId   
            return new Promise((resolve, reject) => {
                db.get().collection(collection.ORDER_COLLECTION).updateOne
                    ({
                        _id: objectId(orderId),
                        "products": { $elemMatch: { "item": objectId(productId) } }
                    },
                        {
                            $set: { "products.$.status": returnDetails.orderStatus  }
                        }).then((response) => {                               
                            resolve(response)
                        })
            })       
        },


        
    returnStatusInreturnColl:(returnDetails)=>{
  
    let orderId=objectId(returnDetails.orderId)
    returnDetails.orderId=orderId

    let productId=objectId(returnDetails.productId)
    returnDetails.productId=productId
       
            return new Promise((resolve, reject) => {
                db.get().collection(collection.RETURN_COLLECTION).updateOne({_id: objectId(orderId)} ,{$set: { "orderStatus": returnDetails.orderStatus }}).then(() => {                                          
                            resolve()
                        })                  
        })
    },
        // -------------------------------------------------------------ADMIN DASHBOARD------------------------------------------------------------//

        getUserCount:()=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION).find().count().then((count)=>{
                    resolve(count)

                })
            })
        },


        getTotalSaleAmount:()=>{
            return new Promise ((resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $group:{ _id:'',totalAmount:{$sum:'$totalAmount'} }
                    },
                    {
                        $project:{
                            totalAmount:1,_id:0
                        }
                    }

                ]).toArray().then((totalAmount)=>{
                    
                    resolve(totalAmount)

                })
            })
        },
        createCouponCollection:(coupondetails)=>{
            couponValue=coupondetails.couponvalue
            couponValue=parseInt(couponValue)
            coupondetails.couponvalue=couponValue
            coupondetails.minamount=parseInt(coupondetails.minamount)
    
            return new Promise((resolve,reject)=>{             
                db.get().collection(collection.COUPON_COLLECTION).insertOne(coupondetails).then(()=>{
                    resolve()
                })
            })
        },



        getCoupons:()=>{
            return new Promise ((resolve,reject)=>{
                db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((coupons)=>{
                    resolve(coupons)

                })

            })
        } ,



// ----------------------------------------------------------GRAPH IN ADMIN------------------------------------------------------//


         getTotalSalesGraph:()=>{
        return new Promise (async(resolve,reject)=>{
            let weeklySale=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: '$products'

                },
                {
                    $match:{
                        'products.status':{$nin:['cancelled']}
                    }
                },
                {
                    $group:{
                        _id:'$date',
                        totalAmount:{$sum:'$totalAmount'} 
                    }
                },
                {
                    $sort:{
                        _id:-1
                    }
                },
                {
                    $limit:7
                },
                {
                    $sort:{
                        _id:1
                    }
                }
                

            ]).toArray()


            let monthlySales=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        'products.status':{$nin:['cancelled']}
                    }
                },
                {
                    $group:{
                         _id:{date:'$orderMonth'},
                        totalAmount:{$sum:'$totalAmount'} 
                    }
                },
                {
                    $sort:{
                        _id:-1
                    }
                },
                {
                    $limit:7
                },
                {
                    $sort:{
                        _id:1
                    }
                }
                

            ]).toArray()


            let yearlySales=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        'products.status':{$nin:['cancelled']}
                    }
                },
                {
                    $group:{
                         _id:{date:'$orderYear'},
                        totalAmount:{$sum:'$totalAmount'} 
                    }
                },
                {
                    $sort:{
                        _id:-1
                    }
                },
                {
                    $limit:7
                },
                {
                    $sort:{
                        _id:1
                    }
                }
                

            ]).toArray()
             resolve({weeklySale,monthlySales,yearlySales}) 
        })
    },


// -------------------------------------------------------------SALES REPORT DOWNLOAD------------------------------------------------------------------------//


    getTotalSalesReport:()=>{
        return new Promise (async(resolve,reject)=>{
            let weeklySale=await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $group:{
                        _id:'$date',
                        totalAmount:{$sum:'$totalAmount'},
                        count:{$sum:1}
                    }
                },
                {
                    $sort:{
                        _id:-1
                    }
                },
                {
                    $limit:30
                },
                {
                    $sort:{
                        _id:1
                    }
                }
                

            ]).toArray()


            let monthlySales=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group:{
                        _id:'$orderMonth',
                        totalAmount:{$sum:'$totalAmount'},
                        count:{$sum:1}
                    }
                },
                {
                    $sort:{
                        _id:-1
                    }
                },
                {
                    $limit:30
                },
                {
                    $sort:{
                        _id:1
                    }
                }
                

            ]).toArray()


            let yearlySales=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group:{
                        _id:'$orderYear',
                        totalAmount:{$sum:'$totalAmount'},
                        count:{$sum:1}
                    }
                },
                {
                    $sort:{
                        _id:-1
                    }
                },
                {
                    $limit:30
                },
                {
                    $sort:{
                        _id:1
                    }
                }
                

            ]).toArray()

            console.log(weeklySale)
             resolve({weeklySale,monthlySales,yearlySales}) 


        })

    },



// --------------------------------------------------------PAYMENT PIE CHART-------------------------------------------------------------//
    paymentMethod:()=>{
        return new Promise(async(resolve,reject)=>{
           let cod=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: '$products'
                
                },
                {
                    $match:{
                        'products.status':{$nin:['cancelled']}
                    }
                },
                {
                    $match:{paymentMethod:'COD'}
                },
                {
                    $group:{
                        _id:'$paymentMethod',
                        count:{$sum:1},
                        
                    }
                },

            ]).toArray()

           let razor=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: '$products'
                
                },
                {
                    $match:{
                        'products.status':{$nin:['cancelled']}
                    }
                },
                {
                    $match:{paymentMethod:'Direct-Bank-Transfer'}
                },
                {
                    $group:{
                        _id:'$paymentMethod',
                        count:{$sum:1},
                        
                    }
                },


            ]).toArray()

          let paypal=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: '$products'
                
                },
                {
                    $match:{
                        'products.status':{$nin:['cancelled']}
                    }
                },
                {
                    $match:{paymentMethod:'Paypal'}
                },
                {
                    $group:{
                        _id:'$paymentMethod',
                        count:{$sum:1},
                        
                    }
                },

            ]).toArray()
                resolve({cod,razor,paypal})         
        })
    },


    getSearchedProducts:(payload)=>{     
        return new Promise(async(resolve,reject)=>{
            let search=await db.get().collection(collection.PRODUCT_COLLECTION).find({laptops:{$regex:new RegExp(payload,'i')}}).toArray()
            search=search.slice(0,10)
            resolve(search)
        })
        


    },



    getProductsCount:()=>{
        return new Promise(async(resolve,reject)=>{
         let count=await db.get().collection(collection.PRODUCT_COLLECTION).find().count()
         resolve(count)
        })
    },


    getPaginatedResult:(limit,startIndex)=>{ 
        return new Promise(async (resolve, reject) => {
         let products = await db.get().collection('product').find().limit(limit).skip(startIndex).toArray()
            resolve(products)
        })
    },



    // -------------------------------------------------PAGINATION FOR USER IN ADMIN ORG-----------------------------------------------------------//

   
    getPaginatedUserResult:(limit,startIndex)=>{
    return new Promise(async (resolve, reject) => {
     let user = await db.get().collection(collection.USER_COLLECTION).find().limit(limit).skip(startIndex).toArray()           
        resolve(user)
    })

},

//     getrefundProducts:()=>{
//     return new Promise(async (resolve, reject) => {
//         let user = await db.get().collection(collection.RETURN_COLLECTION).aggregate([
//             {
//                 $match:$refund
//             }
//         ]).toArray().then((user)=>{
//             console.log(user);
//             console.log('===============');
//             resolve(user)

//         })          
          
//        })
   

// }


}       
            

   

