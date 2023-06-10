// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');

// Path to your service account key file
const keyFilename = '../studious-optics-388905-554dfafd7d7d.json'

// Creates a client
const client = new vision.ImageAnnotatorClient({ keyFilename });

// File to analyze
const fileName = 'C:/Users/Zhang Yueming/Desktop/20221220110712.jpg';

// Wrap the API call in an async function
async function detectLabels() {
    // Performs label detection on the local file
    const [result] = await client.labelDetection(fileName);
    const labels = result.labelAnnotations;
    console.log('Labels:');
    labels.forEach(label => console.log(label.description));
}

// Call the function
detectLabels();
