
const collection = require('../configuration/collection');
var db=require('../configuration/connection')

var objectId=require('mongodb').ObjectId
module.exports={
      
    getCouponDetails:(couponid)=>{
        return new Promise((resolve,reject)=>{     
        db.get().collection(collection.COUPON_COLLECTION).findOne({_id:objectId(couponid)}).then((coupon)=>{
            resolve(coupon)
        })
    })
},




updateCouponDetails:(id,couponDetails)=>{
    console.log(id);

    
        console.log(id+"-------------")
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).updateOne({_id:objectId(id)},{$set:{
                laptops:couponDetails.couponcode,
                desc:couponDetails.desc,
                coupontype:couponDetails.coupontype,
               couponvalue:couponDetails.couponvalue,
               todate:couponDetails.todate,
               fromdate:couponDetails.fromdate

              
            }
        }).then(()=>{
            resolve()
    
        })
        })
    },




deleteCoupon: (couponid) => {
    return new Promise((resolve, reject) =>{
        db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(couponid)}).then(()=>{
            resolve()
        })

    });
},
   

}

