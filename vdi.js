const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { exec } = require("child_process");

const fileIdentifier = ".h19v04.";
const fileExtension = ".hdf";
const downloadFolder = "C:/Users/PC/Desktop/modis/vdi/hdf/";
let downloadedFileName = "";

//TODO: Check if file is already downloaded.
//TODO: Create path regarding selected date.
//TODO: Rename file by format that JICA sent.
//TODO: Log result of the action.

//let url = "https://e4ftl01.cr.usgs.gov/MOLT/MOD13Q1.061/2023.01.17/";
let url = "https://e4ftl01.cr.usgs.gov/MOLT/MOD13Q1.061/";

const token =
  "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6Iml2by5taW5pYyIsImV4cCI6MTY2OTQ0ODkyOCwiaWF0IjoxNjY0MjY0OTI4LCJpc3MiOiJFYXJ0aGRhdGEgTG9naW4ifQ.phOmuKNV1-VypNsLKb-odPiWYC2VUPuQNLYnLnSuwjyzI8-Cs8KuYbEwPVu7TVsiGWdahaayPOnRuewv0rlJw0WQ7v6Pq5C_dUZOCZS2GEjwCiwk4dXTTjt9SmGIeTVLsvhVtWQHHGI-q4Yk7gW0EHJ0vdP5IeViJvg2eWd5Hqi1qRG4sic9KNwM8ZWLYiND4gBQ5ZfSIxbKwAYAK-Z07rWkzPgP4fNCEe43K-tksEc5q59zOzP7dG0IlWA1iKHc8DlJR2QrsgvFYQUBF9NQ4Q_POpaRkzILmqmwRGVqpuKp86wQ1bjHRm9C53D8vtqisgmBrpJjul72aXha0M6smg";
let fileUrl = "";

let originalFilename = "";
let blnExistFile = false; //Need to stop iterating when this value is true

async function scrapeData(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const listItems = $("a");
    listItems.each((idx, el) => {
      if ($(el).text().includes(fileIdentifier) && $(el).text().endsWith(fileExtension)) {
        originalFilename = $(el).text();
        console.log("FileName", originalFilename);
        fileUrl = url + originalFilename;
        blnExistFile = true;
        downloadedFileName = originalFilename;
      }
    });
    if (blnExistFile) {
      console.log("URL: ", fileUrl);
      //await downloadFile(fileUrl, token, downloadFolder + originalFilename);
    }
  } catch (err) {
    //console.error("Error", err);
  }
}

async function downloadFile(url, token, filePath) {
  let command = `wget -e robots=off -m -np -R .html,.tmp -nH --cut-dirs=4 "${url}" --header "Authorization: Bearer ${token}" -O ${filePath}`;
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.log("ERROR", err);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}

//scrapeData(url);
iterateDates();

async function iterateDates() {
  let loop = new Date();
  while (!blnExistFile) {
    console.log("Date", formatDate(loop));
    await scrapeData(url + formatDate(loop) + "/");

    let newDate = loop.setDate(loop.getDate() - 1);
    loop = new Date(newDate);
  }
}

function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

function formatDate(date) {
  return [date.getFullYear(), padTo2Digits(date.getMonth() + 1), padTo2Digits(date.getDate())].join(".");
}
