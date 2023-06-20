const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { exec } = require("child_process");

const token =
  "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6Iml2by5taW5pYyIsImV4cCI6MTY5MjM0ODQxOSwiaWF0IjoxNjg3MTY0NDE5LCJpc3MiOiJFYXJ0aGRhdGEgTG9naW4ifQ.1OT1RZv5jAFEi0NfIAAzXg-5DN_qZaG1OC2HOHynL-0Qnb4Xlx4AxZiJb3pn4JUJRH6VDWnY6P4cf4DumWdacS7sxk5GIRBsFDYV_uYHTHIEFFhijgVEydyq6J5WRr55nG9blVv8n9bnuM3RBoz4C1XmGAxsL6nAgzwWg50nItc0MtIfN3jCurf96lR8BqWxPewn9_ZUAdNE7hQYYBDYs9hCwc5UfWVJgznYHsHRoQpUzklB2EzqMG0ajEdtTE-mJi07BIbubtxGIXngDWHjlkP3tKYPLSeS66rewfP8XfNi0-NiicHiSIBtZ_icbkbrxDz-W5zNI9rJSXIEeiRPGg";
let url = "https://e4ftl01.cr.usgs.gov/MOLT/MOD13Q1.061/";
let fileUrl = "";
let fileModisUrl = "";
let originalFilename = "";
let blnExistFile = false; //Need to stop iterating when this value is true
let blnFound = false; //Same as above, but for MOD09GA.061
let vdiFileName = "temp.tif",
  ndiiFileName = "temp.tif";

const fileIdentifier = ".h19v04.";
const fileExtension = ".hdf";
const downloadFolder = "C:/Users/PC/Desktop/modis/vdi/";
const downloadModisFolder = "C:/Users/PC/Desktop/modis/ndii/";

let urlModis = "https://e4ftl01.cr.usgs.gov/MOLT/MOD09GA.061/";
let originalModisFilename = "";

//TODO: Check if file is already downloaded.
//TODO: Create path regarding selected date.
//TODO: Rename file by format that JICA sent.
//TODO: Log result of the action.

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
      }
    });
    if (blnExistFile) {
      console.log("URL: ", fileUrl);
      await downloadFile(fileUrl, token, downloadFolder + originalFilename);
      await getLatestModis09A1();
    }
  } catch (err) {
    //console.error("Error", err);
  }
}

async function downloadFile(url, token, filePath) {
  if (!fs.existsSync(filePath)) {
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
}

//scrapeData(url);
iterateDates();

async function iterateDates() {
  let loop = new Date();
  while (!blnExistFile) {
    vdiFileName = `${formatDate(loop)}.tif`;
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

/** Methods for MODIS09A1 - download newest file and store filename value */
async function getLatestModis09A1() {
  let loop = new Date();
  while (!blnFound) {
    ndiiFileName = `${formatDate(loop)}.tif`;
    console.log("Date", formatDate(loop));
    await scrapeDataModis09A1(urlModis + formatDate(loop) + "/");

    let newDate = loop.setDate(loop.getDate() - 1);
    loop = new Date(newDate);
  }
}

async function scrapeDataModis09A1(tempUrl) {
  try {
    const { data } = await axios.get(tempUrl);
    const $ = cheerio.load(data);
    const listItems = $("a");
    listItems.each((idx, el) => {
      if ($(el).text().includes(fileIdentifier) && $(el).text().endsWith(fileExtension)) {
        originalModisFilename = $(el).text();
        console.log("FileName09A", originalModisFilename);
        blnFound = true;
        fileModisUrl = tempUrl + originalModisFilename;
        originalModisFilename = originalModisFilename;
      }
    });
    if (blnFound) {
      console.log("URL09A: ", tempUrl);
      await downloadFile(fileModisUrl, token, downloadModisFolder + originalModisFilename);
      setTimeout(convertToTiff, 90000);
      //await convertToTiff();
    }
  } catch (err) {
    //console.error("Error", err);
  }
}

async function convertToTiff() {
  let command = `gdal_translate -of GTiff HDF4_EOS:EOS_GRID:"${downloadFolder}${originalFilename}":MODIS_Grid_16DAY_250m_500m_VI:"250m 16 days NDVI" ${downloadFolder}tif/${vdiFileName}`;
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.log("ERROR", err);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });

  let commandNdii2 = `gdal_translate -of GTiff HDF4_EOS:EOS_GRID:"${downloadModisFolder}${originalModisFilename}":MODIS_Grid_500m_2D:sur_refl_b02_1 ${downloadModisFolder}tif/b2${ndiiFileName}`;
  exec(commandNdii2, (err, stdout, stderr) => {
    if (err) {
      console.log("ERROR", err);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
  let commandNdii6 = `gdal_translate -of GTiff HDF4_EOS:EOS_GRID:"${downloadModisFolder}${originalModisFilename}":MODIS_Grid_500m_2D:sur_refl_b06_1 ${downloadModisFolder}tif/b6${ndiiFileName}`;
  exec(commandNdii6, (err, stdout, stderr) => {
    if (err) {
      console.log("ERROR", err);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}
