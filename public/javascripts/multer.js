
 var multer = require("multer");//to upload images



 const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/images/product')
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname + '-' + Date.now())
  }
});
const upload = multer({ storage: storage });


// handle storage using multer
const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/images/brand')
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname + '-' + Date.now())
  }
});
const upload2 = multer({ storage: storage2 });
module.exports= {
  upload,
  upload2
};
  
  
// upload.array('image'),async
// if(req.file){
//   const pathname=req.file.path
//   console.log('lllllllll');
//   res.send(req.file,pathname)
// }