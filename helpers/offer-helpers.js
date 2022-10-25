var db=require('../configuration/connection')
const collection = require('../configuration/collection');
var objectId=require('mongodb').ObjectId


module.exports={
    categoryOffer:({offerpercent,categoryid})=>{
        offerpercent=parseInt(offerpercent)
       
        return new Promise(async(resolve,reject)=>{
            let response = await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(categoryid)},{
                $set:{
                   offerpercentage:offerpercent,
                    offerStatus:true,
                }
             })
            
        

         let fullproductincat=await db.get().collection(collection.PRODUCT_COLLECTION).find({brandname:objectId(categoryid)}).toArray()
         console.log('oneproduct');
         console.log(fullproductincat);
         console.log('oneproduct');
          resolve(fullproductincat)
            })
    },

    offerApplying:(catfullproducts)=>{
      catfullproducts.Price=parseInt(catfullproducts.Price)
        console.log('@@@@@@@@@@@@@@');
        console.log(catfullproducts);
        console.log('@@@@@@@@@@@@@@');
        return new Promise(async(resolve,reject)=>{
          let category=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catfullproducts.brandname)})
          console.log('&&&&&&&&&&&&');
          console.log(category);
          console.log('&&&&&&&&&&&&');
          if(category.offerStatus){

         let offerPercentage=category.offerpercentage
         console.log('-------------------');
         console.log(offerPercentage);
         console.log(typeof(catfullproducts.Price));
         console.log(catfullproducts.Price);
         console.log('-------------------');
         

         offerPrice= catfullproducts.Price-(catfullproducts.Price * offerPercentage)/100;
         console.log('++++++++++');
         console.log(offerPrice);
         console.log('++++++++++');
         db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(catfullproducts._id)},
         {$set:{Price:offerPrice,originalPrice:catfullproducts.Price}})
           
          }else{
            console.log('&&&&&&&&&&&&');
          }
         
        })

    },


    deleteOffer:(categoryid,offerperc)=>{
      
      return new Promise((resolve,reject)=>{
      
        db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(categoryid)},{$unset:{offerStatus:true,offerpercentage:offerperc}}).then(()=>{
          db.get().collection(collection.PRODUCT_COLLECTION).find({brandname:objectId(categoryid)}).toArray().then((brandproducts)=>{
            console.log('brandproducts');
            console.log(brandproducts);
            console.log('brandproducts');
            resolve(brandproducts)
          })
          
        })
        
      })
    },


    deleteOfferinProd:(eachProduct)=>{
     
      let offerprice=eachProduct.Price
         
      let Oldprice=eachProduct.Price
      console.log('*******************************************************************************');
      console.log(offerprice);
      console.log(Oldprice);
      console.log(eachProduct._id);
      console.log('*******************************************************************************');
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(eachProduct._id)},{$unset:{Price:offerprice}})
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(eachProduct._id)},{$rename:{originalPrice:'Price'}}).then((data)=>{
          // productOffer
          console.log(data);
        })
         
      })
    }
  
}