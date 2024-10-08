const $searchForm = document.getElementById("search-form");
const domainInput = document.getElementById("domain-input");
const nameInput = document.getElementById("name-input");
// const $bookmarkList = document.getElementById("bookmark-list");
const $searchResultTable = document.getElementById("search-result-table");
const $saveBtn = document.getElementById("save-btn");
const $removeBtn = document.getElementById("remove-btn");
const $clearBtn = document.getElementById("clear-btn");
const $searchCheckbox = document.getElementById("search-checkbox");

let isDecodeEnabled = true;

(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      domainInput.value = url;
      await listBookmark();
      await searchCookies(domainInput.value, nameInput.value);
    } catch {}
  }

  nameInput.focus();
})();

$searchForm.addEventListener("submit", handleFormSubmit);
$searchResultTable.addEventListener("click", (event) => {
  const $CopyBtn = event.target.closest(".value-copy");
  if ($CopyBtn) {
    navigator.clipboard.writeText($CopyBtn.dataset.value).then(() => {
      // alert("Copied", $CopyBtn.dataset.value);
    });
  }
});

$searchResultTable.addEventListener("click", async (event) => {
  const $BookmarkBtn = event.target.closest(".row-bookmark");
  if ($BookmarkBtn) {
    const cookieKey = $BookmarkBtn.dataset.domain + $BookmarkBtn.dataset.name;
    const cookieValue = $BookmarkBtn.dataset.value;
    await bookmarkCookie(cookieKey, cookieValue);
    await listBookmark();
  }
});

$searchCheckbox.addEventListener("change", async () => {
  isDecodeEnabled = $searchCheckbox.checked;
  await searchCookies(domainInput.value, nameInput.value);
});

// $saveBtn.addEventListener("click", async () => {});
// $removeBtn.addEventListener("click", async () => {
//   removeBookmark();
//   await listBookmark();
// });
// $clearBtn.addEventListener("click", async () => {
//   clearBookmark();
//   await listBookmark();
// });

async function handleFormSubmit(event) {
  event.preventDefault();
  clearList();
  await searchCookies(domainInput.value, nameInput.value);
}

async function searchCookies(domain, name) {
  if (!domain && !name) return "No domain or name provided";
  try {
    const searchObject = {};
    if (domain) searchObject.url = domain;
    // if (name) searchObject.name = name;
    const cookies = await chrome.cookies.getAll(searchObject);
    const filtered  = name ? cookies.filter(x => x.name.includes(name)) : cookies;
    const decoded  = isDecodeEnabled ? filtered.map(x => ({
      ...x,
      value: decodeURIComponent(x.value)
    })) : filtered;
    const orderedCookies = decoded.sort((a, b) => a.name.localeCompare(b.name));

    return drawCookieList(orderedCookies);
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }
}

let datatable;
async function drawCookieList(cookies) {
  if (datatable) {
    datatable.destroy();
  }
  datatable = new DataTable("#search-result-table", {
    data: cookies,
    paging: false,
    searching: false,
    ordering: false,
    scrollX: true,
    scrollY: 400,
    scrollCollapse: true,
    columns: [
      // {
      //   render: (data, type, row) => {
      //     return `<button class="table-tool-btn row-bookmark" data-name="${row.name}" data-domain="${row.domain}" data-value="${row.value}" ><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 384 512"><path d="M0 48C0 21.5 21.5 0 48 0l0 48V441.4l130.1-92.9c8.3-6 19.6-6 27.9 0L336 441.4V48H48V0H336c26.5 0 48 21.5 48 48V488c0 9-5 17.2-13 21.3s-17.6 3.4-24.9-1.8L192 397.5 37.9 507.5c-7.3 5.2-16.9 5.9-24.9 1.8S0 497 0 488V48z"/></svg></button>`;
      //   },
      // },
      {
        data: "name",
      },
      {
        data: "domain",
      },
      {
        render: (data, type, row) => {
          return `<button class="table-tool-btn value-copy" data-value="${row.value}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512"><path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z"/></svg></button>`;
        },
      },
      {
        data: "value",
      },
      {
        data: "path",
      },
    ],
  });
}

function deleteCookie(cookie) {
  const protocol = cookie.secure ? "https:" : "http:";
  const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

  return chrome.cookies.remove({
    url: cookieUrl,
    name: cookie.name,
    storeId: cookie.storeId,
  });
}

/**
 * bookmark cookie
 */

async function bookmarkCookie(cookieKey, cookieValue) {
  chrome.storage.local.set({ [`${cookieKey}`]: cookieValue }).then(() => {
    console.log("Value is set");
  });
}

function clearBookmark() {
  chrome.storage.local.clear().then(() => {
    console.log("Value is cleared");
  });
}

function removeBookmark(cookieKey) {
  chrome.storage.local.remove("data23").then(() => {
    console.log("Value is removed");
  });
}

function setBookmarkMessage(str) {
  // $bookmarkList.textContent = str;
}

async function listBookmark() {
  clearBookmarkMessage();
  const result = await chrome.storage.local.get(null);
  setBookmarkMessage(JSON.stringify(result));
}

function clearBookmarkMessage() {
  // $bookmarkList.textContent = "";
}

/**
 * search cookie
 */

function setSearchResultMessage(str) {
  $searchResultMessage.textContent = str;
  $searchResultMessage.hidden = false;
}

function clearSearchResultMessage(str) {
  $searchResultMessage.textContent = "";
  $searchResultMessage.hidden = true;
}

function clearList() {
  $searchResultTable.innerHTML = ""; // Clear all child elements
}

function copyCookieValue() {
  console.log("copyCookieValue");
}
