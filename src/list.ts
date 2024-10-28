import GetAllDetails = chrome.cookies.GetAllDetails;
import Cookie = chrome.cookies.Cookie;
import DataTable, { type Api } from "datatables.net-dt";

export function setupList() {
  const $searchForm = document.getElementById("search-form") as HTMLFormElement;
  const domainInput = document.getElementById(
    "domain-input",
  ) as HTMLInputElement;
  const nameInput = document.getElementById("name-input") as HTMLInputElement;
  const $searchResultTable = document.getElementById(
    "search-result-table",
  ) as HTMLElement;
  const $searchCheckbox = document.getElementById(
    "search-checkbox",
  ) as HTMLInputElement;

  let isDecodeEnabled = true;

  (async function initPopupWindow() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab?.url) {
      try {
        domainInput.value = new URL(tab.url).toString();
        await searchCookies(domainInput.value, nameInput.value);
      } catch {}
    }

    nameInput.focus();
  })();

  $searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearList();
    await searchCookies(domainInput.value, nameInput.value);
  });

  $searchResultTable.addEventListener("click", (event) => {
    const $CopyBtn: any = (event.target as HTMLElement)?.closest(".value-copy");
    if ($CopyBtn) {
      navigator.clipboard.writeText($CopyBtn.dataset.value).then(() => {
        // alert("Copied", $CopyBtn.dataset.value);
      });
    }
  });

  $searchCheckbox.addEventListener("change", async () => {
    isDecodeEnabled = $searchCheckbox.checked;
    await searchCookies(domainInput.value, nameInput.value);
  });

  async function searchCookies(domain: string, name: string) {
    if (!domain && !name) return "No domain or name provided";
    try {
      const searchObject: GetAllDetails = {};

      if (domain) {
        searchObject.url = domain;
      }

      const cookies = await chrome.cookies.getAll(searchObject);
      const filtered = name
        ? cookies.filter((x) => x.name.includes(name))
        : cookies;
      const decoded = isDecodeEnabled
        ? filtered.map((x) => ({
            ...x,
            value: decodeURIComponent(x.value),
          }))
        : filtered;
      const orderedCookies = decoded.sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      return drawCookieList(orderedCookies);
    } catch (error: any) {
      return `Unexpected error: ${error.message}`;
    }
  }

  let datatable: Api;
  async function drawCookieList(cookies: Cookie[]) {
    if (datatable) {
      datatable.destroy();
    }
    datatable = new DataTable("#search-result-table", {
      data: cookies,
      paging: false,
      searching: false,
      ordering: false,
      scrollX: true,
      scrollY: "400",
      scrollCollapse: true,
      columns: [
        {
          data: "name",
        },
        {
          data: "domain",
        },
        {
          render: (_data: any, _type: any, row: any) => {
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

  function clearList() {
    $searchResultTable.innerHTML = ""; // Clear all child elements
  }
}
