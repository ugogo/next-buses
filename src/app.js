const puppeteer = require('puppeteer');

const RATP_SCHEDULES_URL = 'https://www.ratp.fr/horaires';
const SELECTORS = {
  BUS_PAGE_INPUT: 'label[for=edit-networks-busratp]',
  BUS_LINE_INPUT: 'input[name=name_line_busratp]',
  BUS_SEARCH_RESULTS: '.ui-autocomplete:last-of-type',
  BUS_SEARCH_FIRST_RESULT: '.ui-autocomplete:last-of-type > li:first-child',
  BUS_STOP_NAME_INPUT: 'input[name=stop_point_busratp]',
  FORM_SUBMIT_BUTTON: '#scheduledform input[type=submit]',
  SCHEDULES: '.horaires-timetable .body-busratp .heure-wrap',
}

const browserOpts = {
  // headless: false,
  // slowMo: 250,
};

const goToBusSection = async (page) => {
  await page.click(SELECTORS.BUS_PAGE_INPUT);
  await page.waitFor(500);
}

const setBusLine = async (line, page) => {
  await page.type(SELECTORS.BUS_LINE_INPUT, line);
  await page.waitForSelector(SELECTORS.BUS_SEARCH_RESULTS, { visible: true });
  await page.click(SELECTORS.BUS_SEARCH_FIRST_RESULT);
  await page.waitForSelector(SELECTORS.BUS_SEARCH_RESULTS, { visible: false });
}

const setLineStop = async (stop, page) => {
  await page.type(SELECTORS.BUS_STOP_NAME_INPUT, stop);
  await page.waitForSelector(SELECTORS.BUS_SEARCH_RESULTS, { visible: true });
  await page.click(SELECTORS.BUS_SEARCH_FIRST_RESULT);
  await page.waitForSelector(SELECTORS.BUS_SEARCH_RESULTS, { visible: false });
}

const submitForm = async (page) => {
  await page.click(SELECTORS.FORM_SUBMIT_BUTTON);
  await page.waitForNavigation();
}

const getSchedules = async (page) => {
  return await page.$$eval(SELECTORS.SCHEDULES, (els) => {
    return Array.from(els)
      .map(el => el.innerHTML);
  });
}

(async () => {
  const browser = await puppeteer.launch(browserOpts);
  const page = await browser.newPage();

  const elementHandle = await page.$('body');
  elementHandle.constructor.prototype.boundingBox = async function() {
    const box = await this.executionContext().evaluate(element => {
      const rect = element.getBoundingClientRect();
      const x = Math.max(rect.left, 0);
      const width = Math.min(rect.right, window.innerWidth) - x;
      const y = Math.max(rect.top, 0);
      const height = Math.min(rect.bottom, window.innerHeight) - y;
      return { x: x, width: width, y: y, height: height };
    }, this);
    return box;
  };
  elementHandle.dispose();

  await page.goto(RATP_SCHEDULES_URL);

  await goToBusSection(page);
  await setBusLine('56', page);
  await setLineStop('Doc', page);
  await submitForm(page);

  const schedules = await getSchedules(page);
  console.log('schedules', schedules);

  await browser.close();
})();
