// npm i cloudinary

import { v2 as cloudinary } from 'cloudinary';

        // Configuration
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET
        })
        
        const uploadOnCloudinary = async (localFilePath)=>{
            try {
                if(!localFilePath) return null;
                //upload the file on cloudinary
                const response =await cloudinary.uploader.upload(localFilePath, {
                    resource_type: "auto"
                })
                //file has been uploaded successfully
                console.log("File is uploaded on Cloudinary", response.url);
                return response;

            } catch (error) {
                fs.unlinkSync(localFilePath)
                //remove locally saved temporary file as the upload operation got failed
                return null;  
            }
        }

        export {uploadOnCloudinary}

    //     cloudinary.v2.uploader.upload("httpS://....." ,
    //     {
    //         public_id: "olympic flag"
    //     },
    //     function(error , result){console.log(result);}
    //    )








