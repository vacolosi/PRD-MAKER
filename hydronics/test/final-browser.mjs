import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const chrome = process.env.HYDRONICS_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!existsSync(chrome)) throw Error(`Chrome not found at ${chrome}`);

const port = 5177;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
let browser;

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('owned final-validation Vite startup timeout')), 15_000);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes(String(port))) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.once('error', reject);
    server.once('exit', (code) => reject(Error(`owned final-validation Vite exited ${code}`)));
  });

  browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = [];
  const external = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') failures.push(`console: ${message.text()}`); });
  page.on('request', (request) => { if (!request.url().startsWith(baseUrl)) external.push(request.url()); });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const tab = async (name) => page.getByRole('tab', { name, exact: true }).click();
  const accept = page.getByRole('button', { name: 'Accept reviewed result' });
  const confirmAllAvailable = async () => {
    await tab('Sections');
    for (const button of await page.getByRole('button', { name: 'Confirm current basis' }).all()) {
      if (!await button.isDisabled()) await button.click();
    }
  };
  const expectReady = async () => page.getByText('Calculation-ready-to-review').first().waitFor();

  await tab('System');
  await page.getByRole('checkbox', { name: /I explicitly acknowledge/ }).check();
  await confirmAllAvailable();
  await expectReady();
  await tab('Files & report');
  if (await accept.isDisabled()) throw Error('Initial eligible 30-GPM calculation could not be locally accepted.');
  await accept.click();
  await page.getByText('Locally accepted / current').first().waitFor();

  await tab('Sections');
  const commonSupply = page.locator('article.section').filter({ has: page.getByRole('heading', { name: /^Common supply/ }) });
  const commonReturn = page.locator('article.section').filter({ has: page.getByRole('heading', { name: /^Common return/ }) });
  const commonSupplyLoss = commonSupply.locator('.loss').first();
  const commonReturnLoss = commonReturn.locator('.loss').first();
  await tab('Circuits');
  await page.getByLabel('Terminal 2 / 20 GPM terminal design GPM').fill('40');
  await tab('Results');
  await page.getByText('Incomplete:').first().waitFor();
  await tab('Sections');
  if (!(await commonSupply.innerText()).includes('50 GPM derived') || !(await commonReturn.innerText()).includes('50 GPM derived')) throw Error('20→40 demand edit did not derive 50 GPM through both shared sections.');
  if (!(await commonSupplyLoss.innerText()).includes('stale') || !(await commonReturnLoss.innerText()).includes('stale')) throw Error('50-GPM shared-flow change did not stale shared applicability confirmations.');
  await page.getByText('Locally accepted result is stale').first().waitFor();
  await tab('Files & report');
  if (!await page.getByText('Historical reviewed result').count() || !await accept.isDisabled()) throw Error('Shared-flow edit did not retain stale historical result and block new acceptance.');

  await confirmAllAvailable();
  await expectReady();
  await tab('Files & report');
  if (await accept.isDisabled()) throw Error('Requalified 50-GPM calculation remained acceptance-blocked.');
  await accept.click();
  await page.getByText('Locally accepted / current').first().waitFor();

  await tab('System');
  await page.getByLabel('Fluid (volume-percent glycol)').selectOption('dowfrost-pg-30vol-2001-09');
  await tab('Results');
  await page.getByText('Incomplete:').first().waitFor();
  await page.getByText('Locally accepted result is stale').first().waitFor();
  await tab('Files & report');
  if (!await accept.isDisabled()) throw Error('Fluid change did not block acceptance until requalification.');
  await confirmAllAvailable();
  await expectReady();
  await tab('Files & report');
  if (await accept.isDisabled()) throw Error('Fluid-requalified result remained acceptance-blocked.');
  await accept.click();
  await page.getByText('Locally accepted / current').first().waitFor();

  await tab('Circuits');
  await page.getByLabel('Terminal 1 / 10 GPM terminal design GPM').fill('1e');
  await tab('Results');
  await page.getByText('Current headline unavailable').first().waitFor();
  await tab('Files & report');
  await page.getByText('Locally accepted result is stale because the editor has unresolved invalid text').first().waitFor();
  if (!await accept.isDisabled() || !await page.getByText('Historical reviewed result').count()) throw Error('Unresolved raw numeric draft did not block acceptance while retaining history.');

  if (failures.length || external.length) throw Error([...failures, ...external.map((url) => `external request: ${url}`)].join('\n'));
  console.log('Final browser checks passed: 30→50 shared-flow stale/requalification/reacceptance, fluid stale/requalification/reacceptance, invalid raw acceptance block, no external requests/errors.');
} finally {
  await browser?.close();
  if (!server.killed) server.kill();
}
