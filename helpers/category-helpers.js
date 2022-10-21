
var db=require('../configuration/connection')
const collection = require('../configuration/collection');


var objectId=require('mongodb').ObjectId
module.exports={




    addCategory:(data)=>{
        
        console.log(data);
        let response = {}
        return new Promise(async(resolve,reject)=>{
            let brandFind =await db.get().collection(collection.CATEGORY_COLLECTION).findOne({brandname:data.brandname})
            if(brandFind){
                response.brandfailed = true
                resolve(response)
               
            }else{
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data).then((response)=>{                  
                    response.brandsuccess = true
                    resolve(response)
                    
                })
            }
            
        })
    },


    // getcategoryCount:()=>{
    //     return new Promise(async(resolve,reject)=>{
    //     let category= await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().count()
    //       resolve(category)
            
    //     })
    // },

   

    getCategory:()=>{
        return new Promise(async(resolve,reject)=>{
        let category= await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
          resolve(category)
            
        })
    },


    getbrandForEdit:(obId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(obId)}).then((response)=>{

                

            resolve(response)
            
            })
            
        })
    },    


    updateBrand: (id,data)=>{
        console.log(data);
        let response = {}
        return new Promise(async(resolve,reject)=>{
           let response = await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(id)},{
            $set:{
                brandname:data.brandname,
                status:data.status
            }
           })
            response.success = true
            resolve(response)
        })
    },


    deleteBrand:({id})=>{
        console.log(id)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(id)}).then((response)=>{
                resolve(response)
            })
        })
    },
// --------------------------------------------------------------CATEGORY FILTERING-----------------------------------------------------------------

filterdCat:(catid)=>{
   
    return new Promise(async(resolve,reject)=>{
    let check = Array.isArray(catid.brandname)
            
    if(check){
    brandid=catid.brandname  
    brandid=brandid.map(function(brand){
        return objectId(brand)
    })
            
    }
    else{
        brandid = Object.values(catid);    
        var brandid = brandid.map(function(brand){     
            return objectId(brand) 
          })       
    }
      let cat=await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
        {
            
            $match:{
                brandname:{
                    $in:brandid
                }
            }
        }
      ]).toArray()      
      resolve(cat)
    })
}

}
