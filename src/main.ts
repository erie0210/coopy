import "./style.css";
import { setupList } from "./list.ts";

(document.querySelector<HTMLDivElement>("#app") as HTMLDivElement).innerHTML = `
  <div id="header">
    <!-- <h3>bookmark</h3> -->
    <!-- <div id="bookmark-list"></div> -->
  </div>
  <section id="search-section">
    <h3>Search</h3>
    <label for="search-checkbox">Decode Value</label>
    <input type="checkbox" id="search-checkbox" checked />
    <form id="search-form">
      <label for="domain-input">Domain</label>
      <input type="text" id="domain-input" />
      <label for="name-input">Name</label>
      <input type="text" id="name-input" />
      <button type="submit" class="submit-btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 512 512"
        >
          <path
            d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6 .1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"
          />
        </svg>
      </button>
    </form>
  </section>
  <section id="search-result">
    <table
      id="search-result-table"
      class="display compact order-column stripe"
      style="width: 100%"
    ></table>
  </section>
  <!-- <button id="save-btn">Save Cookies</button>
  <button id="remove-btn">Remove Cookies</button>
  <button id="clear-btn">Clear Cookies</button> -->
`;

setupList();
