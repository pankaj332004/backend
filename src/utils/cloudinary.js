// import {v2 as cloudinary} from 'cloudinary';
// import fs from 'fs';

// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if(!localFilePath) return null;
//     // Upload the image to Cloudinary
//     const result = await cloudinary.uploader.upload(localFilePath, {
//         return_type: 'auto',
//     }) // Automatically detect the file type (image, video, etc.)
//     // file has been uploaded successfull
//     console.log("file is uploaded on cloudinary",
//         result.url
//     );
//     return result;
//   }
//     catch (error) {
//         fs.unlinkSync(localFilePath); // Delete the local file after upload attempt
//         return null;
//     }
// }
    


// export { uploadOnCloudinary };


import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // auto-detect image, video, etc.
    });

    // Delete local file after successful upload
    fs.unlinkSync(localFilePath);

    console.log("File uploaded to Cloudinary:", result.secure_url);

    return result;

  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);

    // Delete local file if it exists
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export { uploadOnCloudinary };