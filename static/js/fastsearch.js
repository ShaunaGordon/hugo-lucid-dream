// TODO: Consider just instantiating here and using setCollection() later
var fuse; // holds our search engine
var searchVisible = false;
var firstRun = true; // allow us to delay loading json data unless search activated
var resultsAvailable = false; // Did we get any search results?

const mainInput = document.getElementById('searchInput'); // input box for search
const searchComponent = document.getElementById("fastSearch");
const searchResults = document.getElementById("searchResults");

const hideSearch = () => {
  searchComponent.style.visibility = "hidden";
  document.activeElement.blur();
  searchVisible = false;
}

const showSearch = () => {
  searchComponent.style.visibility = "visible"; // show search box
  mainInput.focus(); // put focus in input box so you can just start typing
  searchVisible = true; // search visible
}

const toggleSearch = () => {
  if(searchVisible) {
    hideSearch();
  } else {
    showSearch();
  }
}

const getFirstResult = () => {
  if (resultsAvailable) {
    return searchResults.firstElementChild.firstElementChild; // first result container — used for checking against keyboard up/down location
  }
}

const moveHighlight = (event, direction) => {
  const directions = {
    up: "previousElementSibling",
    down: "nextElementSibling"
  }
  if (searchVisible && resultsAvailable) {
    event.preventDefault(); // stop window from scrolling

    const first = getFirstResult();
    const next = document.activeElement.parentElement[directions[direction]]?.firstElementChild;

    if(next) {
      next.focus();
    } else if(document.activeElement == mainInput) {
      first.focus();
    } else if(document.activeElement == first) {
      mainInput.focus();
    }
  }
}

// ==========================================
// The main keyboard event listener running the show
//
document.addEventListener('keydown', function(event) {

  // CMD-/ (ctrl-/ for non-Mac) to show / hide Search
  if ((event.metaKey || event.ctrlKey) && event.key === '/') {
      // Load json search index if first time invoking search
      // Means we don't load json unless searches are going to happen; keep user payload small unless needed
      if(firstRun) {
        loadSearch(); // loads our json data and builds fuse.js search index
        firstRun = false; // let's never do this again
      }

      // Toggle visibility of search box
      toggleSearch();
  }

  switch (event.key) {
    case 'Escape':
      hideSearch();
      break;
    case 'ArrowDown':
      moveHighlight(event, 'down');
      break;
    case 'ArrowUp':
      moveHighlight(event, 'up');
    default:
      break;
  }
});


// ==========================================
// execute search as each character is typed
//
mainInput.onkeyup = function(e) {
  executeSearch(this.value);
}


// ==========================================
// fetch some json without jquery
//
// TODO: Convert to Fetch API
// TODO: Consider doing this before first search attempt (async call ftw), and save to localstorage or local cache of some sort
function fetchJSONFile(path, callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4) {
          if (httpRequest.status === 200) {
              var data = JSON.parse(httpRequest.responseText);
              if (callback) callback(data);
          }
      }
  };
  httpRequest.open('GET', path);
  httpRequest.send();
}


// ==========================================
// load our search index, only executed once
// on first call of search box (CMD-/)
//
function loadSearch() {
  fetchJSONFile('/index.json', function(data){

      var options = { // fuse.js options; check fuse.js website for details
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
      };

      fuse = new Fuse(data, options); // build the index from the json file

  });
}


// ==========================================
// using the index we loaded on CMD-/, run
// a search query (for "term") every time a letter is typed
// in the search box
//
function executeSearch(term) {
  const results = fuse.search(term); // the actual query being run using fuse.js
  let searchitems = []; // our results bucket

  if (results.length === 0) { // no results based on what was typed into the input box
    resultsAvailable = false;
    searchitems = [];
  } else { // build our html
    for (let item in results.slice(0,5)) { // only show first 5 results
      let data = results[item].item;

      let html = `
        <li><a href="${data.permalink}" tabindex="0">
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
    resultsAvailable = true;
  }

  searchResults.innerHTML = searchitems.join('');
}
