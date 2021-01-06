const Nightmare = require("nightmare");
const nightmare = Nightmare({ show: true });

const { JSDOM } = require("jsdom");
const { window } = new JSDOM();
const $ = require("jquery")(window);

const util = require("util");
const fs = require("fs");

const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

//callback
//promise
//async await

let arrLink = [];

async function searchKeyword() {
  console.log("start to search...");
  await nightmare
    .goto("https://tw.buy.yahoo.com/category/40072453")
    .wait(1000)
    .catch((error) => {
      console.error("Search failed:", error);
    });
}

async function parseHtml() {
  console.log("perseHtml");

  let html = await nightmare.evaluate(() => {
    return document.documentElement.innerHTML;
  });

  let count = 0;

  $(html)
    .find(".BaseGridItem__grid___2wuJ7")
    .each((index, element) => {
      let name = $(element).find(".BaseGridItem__itemInfo___3E5Bx").text();
      let price = $(element).find(".BaseGridItem__price___31jkj").text();
      let href = $(element).find("a").attr("href");

      console.log("name", name);
      console.log("price", price);
      console.log("href", href);
      let obj = {};
      obj.name = name;
      obj.price = price;
      obj.href = href;

      arrLink.push(obj);
    });

  await writeJson();
}

async function getData() {
  console.log("getData");

  let data = JSON.parse(await readFile("output/Iphone12.json"));
  console.log("data", data);

  for (let i = 0; i < data.length; i++) {
    const data2 = await parseDetail(data[i].href);
  }
}

async function parseDetail(url){
    console.log('url',url);

    let allData = {};
    let picsArray = [];

    await nightmare.goto(url).wait(1000);

    let html = await nightmare.evaluate(()=>{
        return document.documentElement.innerHTML;
    })

    let totalPics = $(html).find(".ImageHover__thumbnailList___1qqYN > span").length;

    for(let i=1; i <= totalPics; i++){
        await nightmare.mouseover("div.ImageHover__thumbnailList___1qqYN >span:nth-child(" + i +")" ).wait(1000)

        let html2 = await nightmare.evaluate(()=>{
            return document.documentElement.innerHTML;
        })
        if($(html2).find(".LensImage__img___3khRA").attr('src') != undefined){
            picsArray.push($(html2).find(".LensImage__img___3khRA").attr('src'))
    }

    }
allData["pics"] = picsArray;

console.log('allData',allData);

return allData;

}

async function writeJson() {
  if (!fs.existsSync("output")) {
    await mkdir("output", { recursive: true });
  }

  await writeFile(
    "output/" + "Iphone12.json",
    JSON.stringify(arrLink, null, 2)
  );
}

async function close() {
    await nightmare.end((err) => {
      if (err) throw err;
      console.log("Nightmare is closed.");
    });
  }

async function asyncArray(functionList) {
  for (let func of functionList) {
    await func();
  }
}

try {
  asyncArray([searchKeyword, parseHtml, getData, close]).then(async () => {
    console.log("Done.");
  });
} catch (err) {
  console.log("err:", err);
}
