function getSearchTermFromLocation() {
  const sPageURL = window.location.search.substring(1);
  const sURLVariables = sPageURL.split('&');
  for (let url = 0; url < sURLVariables.length; url++) {
    var sParameterName = sURLVariables[url].split('=');
    if (sParameterName[0] == 'q') {
      return decodeURIComponent(sParameterName[1].replace(/\+/g, '%20'));
    }
  }
}

function joinUrl (base, path) {
  path.substring(0, 1) === "/" // path starts with `/`.
  ? path
  : base.substring(base.length-1) === "/" // base ends with `/`
    ? path = base + path;
    : path = base + "/" + path;
  return path;
}

function formatResult (location, title, summary) {
  return '<article><h3><a href="' + joinUrl(base_url, location) + '">'+ title + '</a></h3><p>' + summary +'</p></article>';
}

function displayResults (results) {
  const search_results = document.getElementById("mkdocs-search-results");
  while (search_results.firstChild) {
    search_results.removeChild(search_results.firstChild);
  }
  if (results.length > 0){
    for (let result = 0; result < results.length; result++){
      const result = results[result];
      const html = formatResult(result.location, result.title, result.summary);
      search_results.insertAdjacentHTML('beforeend', html);
    }
  } else {
    search_results.insertAdjacentHTML('beforeend', "<p>No results found</p>");
  }
}

function doSearch () {
  const query = document.getElementById('mkdocs-search-query').value;
  if (query.length > 2) {
    if (!window.Worker) {
      displayResults(search(query));
    } else {
      searchWorker.postMessage({query: query});
    }
  } else {
    // Clear results for short queries
    displayResults([]);
  }
  query.length > 2
  ? (
      !window.Worker
        ? displayResults(search(query)
        : searchWorker.postMessage({query: query})
    )
  : displayResults([]); 
}

function initSearch () {
  const search_input = document.getElementById('mkdocs-search-query');
  if (search_input) {
    search_input.addEventListener("keyup", doSearch);
  }
  const term = getSearchTermFromLocation();
  if (term) {
    search_input.value = term;
    doSearch();
  }
}

function onWorkerMessage (e) {
  if (e.data.allowSearch) {
    initSearch();
  } else if (e.data.results) {
    var results = e.data.results;
    displayResults(results);
  }
}

if (!window.Worker) {
  console.log('Web Worker API not supported');
  // load index in main thread
  $.getScript(joinUrl(base_url, "search/worker.js")).done(function () {
    console.log('Loaded worker');
    init();
    window.postMessage = function (msg) {
      onWorkerMessage({data: msg});
    };
  }).fail(function (jqxhr, settings, exception) {
    console.error('Could not load worker.js');
  });
} else {
  // Wrap search in a web worker
  const searchWorker = new Worker(joinUrl(base_url, "search/worker.js"));
  searchWorker.postMessage({init: true});
  searchWorker.onmessage = onWorkerMessage;
}
