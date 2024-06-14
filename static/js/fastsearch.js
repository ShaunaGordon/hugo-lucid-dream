const search = {
  searchVisible: false,
  resultsAvailable: false,
  mainInput: document.getElementById('searchInput'),
  searchComponent: document.getElementById('fastSearch'),
  searchResults: document.getElementById('searchResults'),
  searchHint: document.getElementById('searchHint'),
  searchMod: document.getElementById('searchMod'),
  options: {
    shouldSort: true,
    location: 0,
    distance: 100,
    threshold: 0.4,
    minMatchCharLength: 2,
    keys: [
      'title',
      'permalink',
      'tags',
      'categories',
      'series',
      'subtitle',
      'description'
      ]
  },

  hideSearch: () => {
    search.searchComponent.style.visibility = "hidden";
    document.activeElement.blur();
    search.searchVisible = false;
    search.searchHint.style.opacity = 1;
  },

  showSearch: () => {
    search.searchComponent.style.visibility = "visible"; // show search box
    search.mainInput.focus(); // put focus in input box so you can just start typing
    search.searchVisible = true; // search visible
    search.searchHint.style.opacity = 0;
  },

  toggleSearch: () => {
    if(search.searchVisible) {
      search.hideSearch();
    } else {
      search.showSearch();
    }
  },

  getFirstResult: () => {
    if (search.resultsAvailable) {
      return search.searchResults.firstElementChild.firstElementChild; // first result container — used for checking against keyboard up/down location
    }
  },

  moveHighlight: (event, direction) => {
    const directions = {
      up: "previousElementSibling",
      down: "nextElementSibling"
    }
    if (search.searchVisible && search.resultsAvailable) {
      event.preventDefault(); // stop window from scrolling

      const first = search.getFirstResult();
      const next = document.activeElement.parentElement[directions[direction]]?.firstElementChild;

      if(next) {
        next.focus();
      } else if(document.activeElement == search.mainInput) {
        first.focus();
      } else if(document.activeElement == first) {
        search.mainInput.focus();
      }
    }
  },

  fetchJSONFile: (path, callback) => {
    fetch(path)
      .then(response => {
        response.json()
          .then(data => {
            if(callback) callback(data);
          })
          .catch(error => console.error(error));
      })
      .catch(error => console.error(error));
  },

  loadSearch: () => {
    // We've never fetched the search data, or we have, but it's old
    if(!localStorage.getItem("lastUpdate") || (localStorage.getItem("lastUpdate") != lastmod)) {
      // Let's fetch and store it
      search.fetchJSONFile('/index.json', data => {
          fuse.setCollection(data); // build the index from the json file
          localStorage.setItem("searchData", JSON.stringify(data));
          localStorage.setItem("lastUpdate", lastmod);
      });
    } else {
      // The site hasn't changed and we have the data cached, so we can just use it
      fuse.setCollection(JSON.parse(localStorage.getItem("searchData")));
    }
  },

  executeSearch: (term) => {
    const results = fuse.search(term); // the actual query being run using fuse.js
    let searchitems = []; // our results bucket

    if (results.length === 0) { // no results based on what was typed into the input box
      search.resultsAvailable = false;
      searchitems = [];
    } else { // build our html
      for (let item in results.slice(0,5)) { // only show first 5 results
        let data = results[item].item;

        let html = `
          <li class="glass"><a href="${data.permalink}" tabindex="0">
            <header class="title">${data.title}</header>
            <span class="subtitle">${data.subtitle == null ? "" : data.subtitle}</span>
            <ul class="meta">
              <li class="date">${data.date}</li>
              <li class="desc">${data.description}</li>
            </ul>
            </a>
          </li>
        `
        searchitems.push(html);
      }
      search.resultsAvailable = true;
    }

    search.searchResults.innerHTML = searchitems.join('');
  },

  detectPlatform: () => {
    /* navigator.platform is deprecated in favor of feature detection,
       but this is exactly the use-case in MDN's docs and there's no
       modern alternative. :upside_down_face:
       We'll continue using this for now. Worst case, it falls back to
       showing ctrl for all platforms.
    */
    let modifier = 'ctrl';
    if("platform" in navigator && (navigator.platform.indexOf("Mac") === 0 ||
    navigator.platform === "iPhone")) {
      modifier = '⌘'
    }
    search.searchMod.innerText = modifier;
  },

  registerListeners: () => {
    document.addEventListener('keydown', event => {

      // CMD-/ (ctrl-/ for non-Mac) to show / hide Search
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
          // Toggle visibility of search box
          search.toggleSearch();
      }

      switch (event.key) {
        case 'Escape':
          search.hideSearch();
          break;
        case 'ArrowDown':
          search.moveHighlight(event, 'down');
          break;
        case 'ArrowUp':
          search.moveHighlight(event, 'up');
        default:
          break;
      }
    });

    search.mainInput.onkeyup = function(e) {
      search.executeSearch(this.value);
    }

    search.searchHint.onclick = () => {
      search.showSearch();
    }
  },

  init: () => {
    search.detectPlatform();
    search.registerListeners();
    search.loadSearch();
  }
};

const fuse = new Fuse([], search.options);

// Load it immediately on file load, so we're ready to go immediately
// The data loads in the background and pulls from local storage unless the site's been updated, so we don't have to worry about excessive server calls
search.init();
