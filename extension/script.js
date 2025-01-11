const titleSelector = 'a.a-link-normal';
const entriesSelector = '.prodDetSectionEntry';
const alternativeEntriesSelector = '.a-text-bold';
const asinRegex = /\/dp\/([A-Z0-9]{10})/;


function updateTitle(element, country) {
    let elementToUpdate = element;
    const span = element.querySelector('span');
    if (span) {
        elementToUpdate = span;
    }

    elementToUpdate.textContent = `[${country}] ${element.textContent}`;
}

function saveCountry(asin, country) {
    sessionStorage.setItem(`country-of-origin:${asin}`, country);
}

function loadCountryFromStorage(asin) {
    return sessionStorage.getItem(`country-of-origin:${asin}`);
}


const process = () => {
    const titles = document.querySelectorAll(titleSelector);
    titles.forEach((title) => {
        // Only consider this the title if it contains just a text node or an h2 node
        if (title.childNodes.length !== 1) {
            return;
        }

        if (title.childNodes[0].nodeType !== Node.TEXT_NODE && title.childNodes[0].tagName !== 'H2') {
            return;
        }

        const link = title.getAttribute('href');
        let asin = asinRegex.exec(link);
        if (!asin) {
            return;
        }

        asin = asin[1];
        const saved = loadCountryFromStorage(asin);

        if (!saved) {
            // Fetch the link and look for the country of origin
            fetch(link)
                .then((response) => response.text())
                .then((html) => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const entries = doc.querySelectorAll(entriesSelector);
                    const otherEntries = doc.querySelectorAll(alternativeEntriesSelector);
                    const entriesToUse = Array.from(entries).concat(Array.from(otherEntries));
                    const countryDiv = Array.from(entriesToUse).find((entry) => entry.textContent.includes('Country of Origin'));
                    if (countryDiv){
                        const country = countryDiv.nextElementSibling;
                        const countryName = country == null ? '??' : country.textContent.trim();
                        saveCountry(asin, countryName);
                        updateTitle(title, countryName);
                    }
                })
                .catch(() => {
                    // Do nothing
                });
        } else {
            updateTitle(title, saved);
        }
    });
}

let lastUrl = null;
setInterval(() => {
    if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        process();
    }
}, 1000);