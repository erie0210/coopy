const form = document.getElementById('control-row');
const domainInput = document.getElementById('domain-input');
const nameInput = document.getElementById('name-input');
const message = document.getElementById('message');
const bookmarkMessage = document.getElementById('bookmark-message');
const cookeList = document.getElementById('cookie-list');
const searchResultMessage = document.getElementById('search-result');

(async function initPopupWindow() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.url) {
        try {
            let url = new URL(tab.url);
            domainInput.value = url;
        } catch {
        }
    }

    nameInput.focus();
})();

form.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
    event.preventDefault();

    clearMessage();
    clearList();
    clearSearchResultMessage();

    await searchCookies(domainInput.value, nameInput.value);
}

/**
 *
 * @param domain 'https://www.inflearn.com/'
 * @param name 'connect.sid'
 * @returns {Promise<*|string>}
 */
async function searchCookies(domain, name) {
    if(!domain && !name) return 'No domain or name provided';

    try {
        const searchObject = {};
        if(domain) searchObject.url = domain;
        if(name) searchObject.name = name;
        const cookies = await chrome.cookies.getAll(searchObject);

        if (cookies.length === 0) {
            setSearchResultMessage(`No cookies found`);
            return;
        }

        setSearchResultMessage(`Found ${cookies.length} cookie(s)`);
        return drawCookieList(cookies);
    } catch (error) {
        return `Unexpected error: ${error.message}`;
    }
}

async function drawCookieList(cookies) {
    return cookies.map(cookie => {
        let li = document.createElement('li');
        li.textContent = JSON.stringify(cookie);
        cookeList.appendChild(li);
    })
}

function deleteCookie(cookie) {
    const protocol = cookie.secure ? 'https:' : 'http:';
    const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

    return chrome.cookies.remove({
        url: cookieUrl,
        name: cookie.name,
        storeId: cookie.storeId
    });
}

function setMessage(str) {
    if(!str)    return;
    message.textContent = str;
    message.hidden = false;
}

function clearMessage() {
    message.hidden = true;
    message.textContent = '';
}

function saveCookies(cookie) {
    let result = '';
    chrome.storage.sync.get("bookmarkCookie", ({cookie}) => {
        result += JSON.stringify(cookie.value)
    })

    return result;
}

function setStoredCookie(cookie) {
    chrome.storage.sync.set({
        ['bookmarkCookie']:cookie
    });
}

function clearBookmark() {
    bookmarkMessage.hidden = true;
    bookmarkMessage.textContent = '';
}

function setSearchResultMessage(str) {
    searchResultMessage.textContent = str;
    searchResultMessage.hidden = false;
}

function clearSearchResultMessage (str) {
    searchResultMessage.textContent = '';
    searchResultMessage.hidden = true;
}

function clearList() {
    cookeList.innerHTML = ""; // Clear all child elements
}
