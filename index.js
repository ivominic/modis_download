const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty");
const fs = require("fs");
const https = require("https");

const fileIdentifier = ".h19v04.";
const fileExtension = ".hdf";
const downloadFolder = "C:/Users/PC/Desktop/modis/";

//const url = "https://e4ftl01.cr.usgs.gov/MOLT/MOD11A1.061/2022.09.25/";
const url = "https://e4ftl01.cr.usgs.gov/MOLT/MOD09GA.061/2022.09.22/";
const token =
  "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6Iml2by5taW5pYyIsImV4cCI6MTY2OTQ0ODkyOCwiaWF0IjoxNjY0MjY0OTI4LCJpc3MiOiJFYXJ0aGRhdGEgTG9naW4ifQ.phOmuKNV1-VypNsLKb-odPiWYC2VUPuQNLYnLnSuwjyzI8-Cs8KuYbEwPVu7TVsiGWdahaayPOnRuewv0rlJw0WQ7v6Pq5C_dUZOCZS2GEjwCiwk4dXTTjt9SmGIeTVLsvhVtWQHHGI-q4Yk7gW0EHJ0vdP5IeViJvg2eWd5Hqi1qRG4sic9KNwM8ZWLYiND4gBQ5ZfSIxbKwAYAK-Z07rWkzPgP4fNCEe43K-tksEc5q59zOzP7dG0IlWA1iKHc8DlJR2QrsgvFYQUBF9NQ4Q_POpaRkzILmqmwRGVqpuKp86wQ1bjHRm9C53D8vtqisgmBrpJjul72aXha0M6smg";
let fileUrl = "";

let originalFilename = "";

// Async function which scrapes the data
async function scrapeData() {
  try {
    let blnExistFile = false;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    //const listItems = $(".class ul li");
    const listItems = $("a");
    listItems.each((idx, el) => {
      if ($(el).text().includes(fileIdentifier) && $(el).text().endsWith(fileExtension)) {
        originalFilename = $(el).text();
        console.log(originalFilename);
        fileUrl = url + originalFilename;
        blnExistFile = true;
      }
    });
    if (blnExistFile) {
      console.log("URL: ", fileUrl);
      await downloadFile(fileUrl, downloadFolder, originalFilename);
    }
  } catch (err) {
    console.error(err);
  }
}

async function downloadFile(url, path, filename) {
  const file = fs.createWriteStream(path + filename);
  let options = {
    host: "e4ftl01.cr.usgs.gov",
    port: 443,
    path: "/MOLT/MOD09GA.061/2022.09.22/" + filename,
    // authentication headers
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  url += "?authorization=Bearer%20" + token;

  const request = https.get(url, function (response) {
    response.pipe(file);

    file.on("finish", () => {
      file.close();
      console.log("Download Completed");
    });
  });
  console.log("Request", request);
}

scrapeData();
