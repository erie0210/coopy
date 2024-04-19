const form = document.getElementById('control-row');
const domainInput = document.getElementById('domain-input');
const nameInput = document.getElementById('name-input');
const message = document.getElementById('message');
const storedCookie = document.getElementById('message');
const cookeList = document.getElementById('cookie-list');
const saveBtn = document.getElementById('save-btn');

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.url) {
        try {
            let url = new URL(tab.url);
            domainInput.value = url;
        } catch {
            // ignore
        }
    }

    // domainInput.focus();
})();

form.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
    event.preventDefault();

    clearMessage();
    clearBookmark();
    // let url = stringToUrl(domainInput.value);
    // if (!url) {
    //     setMessage('Invalid URL');
    //     return;
    // }

    // let message = await deleteDomainCookies(url.hostname);
    let message = await searchCookies(domainInput.value, nameInput.value);
    setMessage(message);
}

function stringToUrl(domainInput) {
    // Start with treating the provided value as a URL
    try {
        return new URL(domainInput);
    } catch {
        // ignore
    }
    // If that fails, try assuming the provided input is an HTTP host
    try {
        return new URL('http://' + domainInput);
    } catch {
        // ignore
    }
    // If that fails ¯\_(ツ)_/¯
    return null;
}

/**
 *
 * @param domain 'https://www.inflearn.com/'
 * @param name 'connect.sid'
 * @returns {Promise<*|string>}
 */
async function searchCookies(domain, name) {
    if(!domain && !name) return 'No domain or name provided';

    let totalCookies = 0;
    try {
        // const cookies = await chrome.cookies.getAll({ name: 'connect.sid' });
        const searchObject = {};
        if(domain) searchObject.url = domain;
        if(name) searchObject.name = name;
        const cookies = await chrome.cookies.getAll(searchObject);

        if (cookies.length === 0) {
            return 'No cookies found';
        }

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

async function deleteDomainCookies(domain) {
    let cookiesDeleted = 0;
    try {
        const cookies = await chrome.cookies.getAll({ domain });

        if (cookies.length === 0) {
            return 'No cookies found';
        }

        let pending = cookies.map(deleteCookie);
        await Promise.all(pending);

        cookiesDeleted = pending.length;
    } catch (error) {
        return `Unexpected error: ${error.message}`;
    }

    return `Deleted ${cookiesDeleted} cookie(s).`;
}

function deleteCookie(cookie) {
    // Cookie deletion is largely modeled off of how deleting cookies works when using HTTP headers.
    // Specific flags on the cookie object like `secure` or `hostOnly` are not exposed for deletion
    // purposes. Instead, cookies are deleted by URL, name, and storeId. Unlike HTTP headers, though,
    // we don't have to delete cookies by setting Max-Age=0; we have a method for that ;)
    //
    // To remove cookies set with a Secure attribute, we must provide the correct protocol in the
    // details object's `url` property.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Secure
    const protocol = cookie.secure ? 'https:' : 'http:';

    // Note that the final URL may not be valid. The domain value for a standard cookie is prefixed
    // with a period (invalid) while cookies that are set to `cookie.hostOnly == true` do not have
    // this prefix (valid).
    // https://developer.chrome.com/docs/extensions/reference/cookies/#type-Cookie
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
    message.hidden = true;
    message.textContent = '';
}
