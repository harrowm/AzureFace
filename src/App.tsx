// var msRest = require("@azure/ms-rest-js");
// var Face = require("@azure/cognitiveservices-face");
import { FaceClient, FaceModels } from "@azure/cognitiveservices-face";
//import { CognitiveServicesCredentials } from "@azure/ms-rest-azure-js";
import { CognitiveServicesCredentials } from "@azure/ms-rest-azure-js";

// const FileSet = require("file-set");
// const createReadStream = require("fs").createReadStream;
// // const uuidV4 = require("uuid/v4");
// const { v4: uuidv4 } = require("uuid");
// uuidv4();

import "./styles.css";

/**
 * Shared variables
 * These variables are shared by more than one example below.
 */
// An image with only one face
let singleFaceImageUrl =
  "https://www.biography.com/.image/t_share/MTQ1MzAyNzYzOTgxNTE0NTEz/john-f-kennedy---mini-biography.jpg";
// An image with several faces
let groupImageUrl =
  "http://www.historyplace.com/kennedy/president-family-portrait-closeup.jpg";
const IMAGE_BASE_URL =
  "https://csdx.blob.core.windows.net/resources/Face/Images/";
// Person Group ID must be lower case, alphanumeric, with '-' and/or '_'.
const PERSON_GROUP_ID = "my-unique-person-group";

/**
 * AUTHENTICATE
 * Used for all examples.
 */
let key = "a9f8074f66c949e391e28cba3e0c36fd";
let endpoint = "https://testfacemh.cognitiveservices.azure.com/";

const credentials = new CognitiveServicesCredentials(key);
const client = new FaceClient(credentials, endpoint);

/**
 * END - AUTHENTICATE
 */
console.log("cred", credentials);
console.log("client", client);

async function faceRec() {
  /**
   * DETECT FACES
   * Detects the faces in the source image, then in the target image.
   */
  console.log("---------------------------------");
  console.log("DETECT SINGLE FACE");

  const options: FaceModels.FaceDetectWithUrlOptionalParams = {
    returnFaceLandmarks: true
  };

  let singleDetectedFace = await client.face
    .detectWithUrl(singleFaceImageUrl, options)
    .then((faces) => {
      console.log("The result is: ");
      console.log(faces);
      return faces[0].faceId;
    })
    .catch((err) => {
      console.log("An error occurred:");
      console.error(err);
    });

  // Detect the faces in a group image. API call returns a Promise<DetectedFace[]>.
  let groupDetectedFaces = await client.face
    .detectWithUrl(groupImageUrl)
    .then((faces) => {
      console.log("Face IDs found in group image:");
      // Initialize empty array of strings
      var faceIds = new Array(faces.length);
      for (let face of faces) {
        faceIds.unshift(face.faceId);
        console.log(face.faceId);
      }
      var filteredIds = faceIds.filter((id) => {
        return id != null;
      });
      return filteredIds;
    })
    .catch((err) => {
      console.log(`No faces detected in group image: ${groupImageUrl}.`);
      throw err;
    });
  console.log();

  /**
   * FIND SIMILAR
   * Find the similar face in the target image, then display face attributes.
   * Uses the group of detected faces array that was detected in Detect Faces.
   */
  console.log("---------------------------------");
  console.log("FIND SIMILAR");
  // The options parameter in findSimilar(faceIds, options)
  // is a Models.FaceFindSimilarOptionalParams parameter (in index.ts)
  // API call returns a Promise<SimilarFace[]>.
  client.face
    .findSimilar(singleDetectedFace, { faceIds: groupDetectedFaces })
    .then((similars) => {
      console.log("Similar faces found in group image:");
      for (let similar of similars) {
        // Search target image list for source face
        console.log(`Face ID: ${similar.faceId}.`);
        // The group image in this example contains a similar face that is turned,
        // so confidence will be lower than a face looking straight ahead.
        console.log(
          `Confidence: ${Number(similar.confidence).toFixed(2) * 100}%`
        );
      }
    })
    .catch((err) => {
      console.log(`No similar faces found in group image: ${groupImageUrl}.`);
      throw err;
    });
  console.log();
  /**
   * END - FIND SIMILAR
   */

  /**
   * VERIFY
   * Verify-Face-To-Face: Verify whether two faces belong to a same person or
   * whether one face belongs to a person.
   */
  console.log("---------------------------------");
  console.log("VERIFY");

  // Create an array to hold the target photos
  let targetImageFileNames = ["Family1-Dad1.jpg", "Family1-Dad2.jpg"];
  // Then declare your source photos, they'll be used to query the target images
  let sourceImageFileNames = ["Family1-Dad3.jpg", "Family1-Son1.jpg"];

  console.log("Detect faces in source images:");
  // Detect faces in the source image array, then get their IDs
  let sourceFaces = await Promise.all(
    sourceImageFileNames.map(async (imageName) => {
      // Returns a Promise<DetectedFace[]>
      return client.face
        .detectWithUrl(IMAGE_BASE_URL + imageName)
        .then((faces) => {
          console.log(
            `${faces.length} face detected from image ${imageName} with ID ${faces[0].faceId}`
          );
          let id = faces[0].faceId;
          return { id };
        })
        .catch((err) => {
          console.log(`No face detected in: ${sourceImageFileNames[0]}.`);
          throw err;
        });
    })
  );
  console.log();

  // Get objects out of sourceFaces array,
  // then get IDs and put in new array for the API call params
  var sourceFaceIds = [];
  for (var dict of sourceFaces) {
    sourceFaceIds.push(dict["id"]);
  }

  console.log("Detect faces in target images:");
  // Detect faces in the target image array, then get their IDs
  let targetFaces = await Promise.all(
    targetImageFileNames.map(async (imageName) => {
      // Returns a Promise<DetectedFace[]>
      return client.face
        .detectWithUrl(IMAGE_BASE_URL + imageName)
        .then((faces) => {
          console.log(
            `${faces.length} face detected from image ${imageName} with ID ${faces[0].faceId}`
          );
          let id = faces[0].faceId;
          return { id };
        })
        .catch((err) => {
          console.log(`No face detected in: ${targetImageFileNames[0]}.`);
          throw err;
        });
    })
  );

  // Get objects out of targetFaces array,
  // then get IDs and put in new array for the API call params
  var targetFaceIds = [];
  for (var dict of targetFaces) {
    targetFaceIds.push(dict["id"]);
  }
  console.log();

  // Compare all source images with a target image
  // (target imnages are of same person, so we compare only 1 to both source images)
  await Promise.all(
    sourceFaceIds.map(async (sourceId) => {
      // Returns a Promise<Verify Result>
      return client.face
        .verifyFaceToFace(sourceId, targetFaceIds[0])
        .then((result) => {
          console.log(
            `Are image IDs \n${sourceId} and \n${targetFaceIds[0]} identical? ${result.isIdentical}`
          );
          // Confidence score 0.0-1.0:
          // lower means less of a match, higher is more of a match
          console.log(
            `with ${Math.round(result.confidence * 100)}% confidence.`
          );
          console.log();
        })
        .catch((err) => {
          throw err;
        });
    })
  );
  /**
   * END - VERIFY
   */
}

export default function App() {
  faceRec();
  return (
    <div className="App">
      <h1>Azure Face Verification!</h1>
      <h2>
        Lets see if we can use the Azure face recognition library to recognize
        my face against my ID card!
      </h2>
    </div>
  );
}
