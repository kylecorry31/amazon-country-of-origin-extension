const titleSelector = "a.a-link-normal";
const entriesSelector = ".prodDetSectionEntry";
const alternativeEntriesSelector = ".a-text-bold";
const loadingText = "Loading...";
const asinRegex = /\/dp\/([A-Z0-9]{10})/;
const madeInRegex = /made in (the )?([A-Za-z ,]+)/i;

function updateTitle(element, country) {
  if (!element) {
    return;
  }
  let elementToUpdate = element;
  const span = element.querySelector("span");
  if (span) {
    elementToUpdate = span;
  }

  const loadingPlaceholder = `[${loadingText}] `;

  if (country == null) {
    elementToUpdate.textContent = element.textContent.replace(
      loadingPlaceholder,
      ""
    );
  } else {
    elementToUpdate.textContent = `[${country}] ${element.textContent.replace(
      loadingPlaceholder,
      ""
    )}`;
  }
}

function getTitle(element) {
  if (!element) {
    return;
  }

  let elementToUpdate = element;
  const span = element.querySelector("span");
  if (span) {
    elementToUpdate = span;
  }
  return elementToUpdate.textContent;
}

function saveCountry(asin, country) {
  sessionStorage.setItem(`country-of-origin:${asin}`, country);
}

function loadCountryFromStorage(asin) {
  return sessionStorage.getItem(`country-of-origin:${asin}`);
}

function getAsin(url) {
  const asin = asinRegex.exec(url);
  if (!asin) {
    return null;
  }
  return asin[1];
}

function getMadeInCountry(text) {
  const country = madeInRegex.exec(text);
  if (!country) {
    return null;
  }
  return country[2];
}

function getCountryOfOrigin(doc) {
  const entries = doc.querySelectorAll(entriesSelector);
  const otherEntries = doc.querySelectorAll(alternativeEntriesSelector);
  const entriesToUse = Array.from(entries).concat(Array.from(otherEntries));
  const countryDiv = Array.from(entriesToUse).find((entry) =>
    entry.textContent.includes("Country of Origin")
  );
  if (countryDiv == null) {
    return getMadeInCountry(doc.body.textContent);
  }

  const country = countryDiv.nextElementSibling;
  if (country == null) {
    return getMadeInCountry(doc.body.textContent);
  }

  return country.textContent.trim();
}

function processProductList() {
  const titles = document.querySelectorAll(titleSelector);
  titles.forEach((title) => {
    // Only consider this the title if it contains just a text node or an h2 node
    if (title.childNodes.length !== 1) {
      return;
    }

    if (
      title.childNodes[0].nodeType !== Node.TEXT_NODE &&
      title.childNodes[0].tagName !== "H2"
    ) {
      return;
    }

    const link = title.getAttribute("href");
    const asin = getAsin(link);
    if (!asin) {
      return;
    }

    const saved = loadCountryFromStorage(asin);

    if (!saved) {
      // Fetch the link and look for the country of origin
      updateTitle(title, loadingText);
      fetch(link)
        .then((response) => response.text())
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const country = getCountryOfOrigin(doc);
          if (country) {
            saveCountry(asin, country);
            updateTitle(title, country);
          } else {
            updateTitle(title, null);
          }
        })
        .catch(() => {
          // Do nothing
          updateTitle(title, null);
        });
    } else {
      updateTitle(title, saved);
    }
  });
}

function processProductPage() {
  const asin = getAsin(window.location.href);
  if (!asin) {
    return;
  }

  const saved = loadCountryFromStorage(asin);
  if (saved) {
    updateTitle(document.querySelector("span#productTitle"), saved);
  } else {
    // Fetch the link and look for the country of origin
    updateTitle(document.querySelector("span#productTitle"), loadingText);
    const country = getCountryOfOrigin(document);
    if (country) {
      saveCountry(asin, country);
      updateTitle(document.querySelector("span#productTitle"), country);
    } else {
      updateTitle(document.querySelector("span#productTitle"), null);
    }
  }
}

let lastUrl = null;
setInterval(() => {
  if (lastUrl !== window.location.href) {
    lastUrl = window.location.href;
    if (lastUrl.includes("/dp/")) {
      processProductPage();
    } else {
      processProductList();
    }
  }
}, 200);
