const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const checkViewport = async (name, width, height) => {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`console:${m.text()}`);
    });

    await page.goto("file:///D:/newportfolio/khabar.html", { waitUntil: "load" });

    const data = await page.evaluate(() => {
      const prev = document.querySelector("a[href*='inksvilla']");
      const about = document.querySelector("footer a[href*='about']");
      return {
        hasTitleInHead: !!document.head.querySelector("title"),
        bodyStartsWithMeta: !!(
          document.body.firstElementChild &&
          document.body.firstElementChild.tagName === "META"
        ),
        hasButton: !!document.querySelector("[data-mobile-menu-button]"),
        hasPanel: !!document.querySelector("[data-mobile-menu-panel]"),
        hasIcon: !!document.querySelector("[data-mobile-menu-icon]"),
        prevHref: prev ? prev.getAttribute("href") : null,
        aboutHref: about ? about.getAttribute("href") : null,
        images: document.images.length,
      };
    });

    const menuBehavior = await page.evaluate(() => {
      const btn = document.querySelector("[data-mobile-menu-button]");
      const panel = document.querySelector("[data-mobile-menu-panel]");
      if (!btn || !panel) return { canTest: false };
      const before = {
        expanded: btn.getAttribute("aria-expanded"),
        hidden: panel.classList.contains("hidden"),
      };
      btn.click();
      const afterOpen = {
        expanded: btn.getAttribute("aria-expanded"),
        hidden: panel.classList.contains("hidden"),
      };
      btn.click();
      const afterClose = {
        expanded: btn.getAttribute("aria-expanded"),
        hidden: panel.classList.contains("hidden"),
      };
      return { canTest: true, before, afterOpen, afterClose };
    });

    const overflow = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      docClientWidth: document.documentElement.clientWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));

    await page.close();
    return { name, data, menuBehavior, overflow, errors };
  };

  const desktop = await checkViewport("desktop", 1366, 900);
  const tablet = await checkViewport("tablet", 820, 1180);
  const mobile = await checkViewport("mobile", 390, 844);

  console.log(JSON.stringify({ desktop, tablet, mobile }, null, 2));
  await browser.close();
})();
