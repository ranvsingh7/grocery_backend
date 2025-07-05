const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, '../beaming-ring-464018-b1-61c54d4ec425.json'), // Path to your service account key
  projectId: 'beaming-ring-464018-b1', // Replace with your Google Cloud project ID
});

const bucketName = 'grocery_image'; // Replace with your bucket name
const bucket = storage.bucket(bucketName);

// Function to upload an image
const uploadImage = async (file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  const { originalname, buffer } = file;
  const blob = bucket.file(originalname);
  const blobStream = blob.createWriteStream({
    resumable: false,
  });

  return new Promise((resolve, reject) => {
    blobStream
      .on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
        resolve(publicUrl);
      })
      .on('error', (err) => {
        reject(err);
      })
      .end(buffer);
  });
};

module.exports = { uploadImage };
