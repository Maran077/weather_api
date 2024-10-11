import puppeteer from "puppeteer";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

async function main(city: string) {
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath: puppeteer.executablePath(),
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto(`https://www.google.com/search?q=weather ${city}`);

  // Remove this if geolocation permission is not necessary
  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://www.google.com", ["geolocation"]);

  const buttons = await page.$$(".wob_df");
  const weatherDetails = [];
  const today = new Date();
  let addDay = 0;

  for (const button of buttons) {
    const text = await page.evaluate((el) => el.textContent, button);
    const degree = await page.$eval(
      "#wob_tm",
      (el) => el?.textContent || "N/A"
    );
    const precipitation = await page.$eval(
      "#wob_pp",
      (el) => el?.textContent || "N/A"
    );
    const humidity = await page.$eval(
      "#wob_hm",
      (el) => el?.textContent || "N/A"
    );
    const wind = await page.$eval("#wob_ws", (el) => el?.textContent || "N/A");

    const date = new Date();
    date.setDate(today.getDate() + addDay);
    const weatherDetail = {
      degree,
      precipitation,
      humidity,
      wind,
      date: date.toString(),
    };

    weatherDetails.push(weatherDetail);
    console.log(text, "weather:", weatherDetail);

    const box = await button?.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    addDay++;
  }

  await browser.close(); // Close the browser

  return weatherDetails;
}

app.get("/weather", async (req, res) => {
  const query = req.query;
  if (query?.city) {
    console.log(query);
    try {
      const weather = await main(query.city as string);
      res.json({ success: true, weather });
    } catch (error) {
      console.error(error);
      res.json({ success: false, error: "something wrong", err: error });
    }
  } else {
    res.json({ success: false, error: "please give city name" });
  }
});

app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});
