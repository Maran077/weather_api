// import puppeteer from "puppeteer";
import puppeteer from "puppeteer-core";
import express from "express";
const chromium = require("@sparticuz/chromium");

const app = express();
const PORT = 3000;
// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function main(city: string) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();

  await page.goto(`https://www.google.com/search?q=weather ${city}`);

  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://www.google.com", ["geolocation"]);

  const buttons = await page.$$(".wob_df");
  const weatheDetails = [];
  const today = new Date();
  let addDay = 0;
  for (const button of buttons) {
    const text = await page.evaluate((el) => el.textContent, button);
    const degree = await page.$eval("#wob_tm", (el) => el?.textContent);
    const precipitation = await page.$eval("#wob_pp", (el) => el?.textContent);
    const humidity = await page.$eval("#wob_hm", (el) => el?.textContent);
    const wind = await page.$eval("#wob_ws", (el) => el?.textContent);

    today.setDate(today.getDate() + addDay);
    const weatheDetail = {
      degree,
      precipitation,
      humidity,
      wind,
      date: today.toString(),
    };
    weatheDetails.push(weatheDetail);
    console.log(text, " weather ", weatheDetail);
    // await sleep(3000);
    const box = await button?.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    addDay++;
  }
  return weatheDetails;
  // const box = await buttons[1]?.boundingBox();
  // if (box) {
  //   await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  // }
}

// main();

app.get("/weather", async (req, res) => {
  const query = req.query;
  if (query?.city) {
    console.log(query);
    try {
      const weather = await main(query.city as string);
      res.json({ success: true, weather });
    } catch (error) {
      res.json({ success: false, error: "something wrong" });
    }
  } else {
    res.json({ success: false, error: "please give city name" });
  }
});

app.listen(PORT, () => {
  console.log(`running on ${PORT}`);
});
