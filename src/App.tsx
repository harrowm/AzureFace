"use strict";

var msRest = require("@azure/ms-rest-js");
var Face = require("@azure/cognitiveservices-face");

const FileSet = require("file-set");
const createReadStream = require("fs").createReadStream;
const uuidV4 = require("uuid/v4");

import "./styles.css";

export default function App() {
  return (
    <div className="App">
      <h1>Azure Face Verification</h1>
      <h2>
        Lets see if we can use the Azure face recognition library to recognize
        my face against my ID card!
      </h2>
    </div>
  );
}
