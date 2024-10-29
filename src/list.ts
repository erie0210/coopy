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

  let currentMessage: HTMLElement | null = null;
  let timeoutId: number | null = null;

  $searchResultTable.addEventListener("click", (event) => {
    const $CopyBtn: any = (event.target as HTMLElement)?.closest(".value-copy");
    if ($CopyBtn) {
      navigator.clipboard.writeText($CopyBtn.dataset.value).then(() => {
        if (currentMessage) {
          document.body.removeChild(currentMessage);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }

        currentMessage = document.createElement("div");
        currentMessage.className = "copy-message";
        currentMessage.textContent = `🍪 cookie copied: ${$CopyBtn.dataset.name}`;
        document.body.appendChild(currentMessage);

        timeoutId = setTimeout(() => {
          if (currentMessage) {
            document.body.removeChild(currentMessage);
            currentMessage = null;
          }
        }, 3000);
      });
    }
  });

  $searchResultTable.addEventListener("click", async (event) => {
    const $deleteBtn: any = (event.target as HTMLElement)?.closest(
      ".delete-cookie",
    );
    if ($deleteBtn) {
      const name = $deleteBtn.dataset.name;

      await chrome.cookies.remove({ name, url: domainInput.value });
      await searchCookies(domainInput.value, nameInput.value);
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
          render: (_data: any, _type: any, row: any) => {
            return `<button class="table-tool-btn delete-cookie" data-name="${row.name}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512"><path d="M135.2 17.7C138.8 7.1 148.8 0 160 0H288c11.2 0 21.2 7.1 24.8 17.7L320 32H432c8.8 0 16 7.2 16 16s-7.2 16-16 16H416V96c0 17.7-14.3 32-32 32H64c-17.7 0-32-14.3-32-32V64H16c-8.8 0-16-7.2-16-16s7.2-16 16-16H128L135.2 17.7zM64 128H384V64H64V128zM32 160H416c17.7 0 32 14.3 32 32V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V192C0 174.3 14.3 160 32 160zM96 224c-8.8 0-16 7.2-16 16V416c0 8.8 7.2 16 16 16s16-7.2 16-16V240C112 231.2 104.8 224 96 224zM192 224c-8.8 0-16 7.2-16 16V416c0 8.8 7.2 16 16 16s16-7.2 16-16V240C208 231.2 200.8 224 192 224zM288 224c-8.8 0-16 7.2-16 16V416c0 8.8 7.2 16 16 16s16-7.2 16-16V240C304 231.2 296.8 224 288 224zM384 224c-8.8 0-16 7.2-16 16V416c0 8.8 7.2 16 16 16s16-7.2 16-16V240C400 231.2 392.8 224 384 224z"/></svg></button>`;
          },
        },
        {
          data: "name",
        },
        {
          data: "domain",
        },
        {
          render: (_data: any, _type: any, row: any) => {
            return `<button class="table-tool-btn value-copy" data-value="${row.value}" data-name="${row.name}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512"><path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z"/></svg></button>`;
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
