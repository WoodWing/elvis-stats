(function() {
  const MAX_STATS_RESULT_COUNT = 10000;
  const MAX_ASSET_COUNT = 900;
  const BASE_URL = '/plugins/stats_api/publish';
 
  var elvisApi;
  var elvisContext;

  var selectedFilterValues = [];
  var selectedHits;
  
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, (s) => {
      return entityMap[s];
    });
  }

  /**
   * Initialize date search components
   */
  function initDateFields() {
    $.datepicker.setDefaults({
      dateFormat: 'dd-mm-yy',
      dayNamesMin: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      firstDay: 1,
      showAnim: 'fadeIn'
    });

    $('#startDate').datepicker();
    $('#endDate').datepicker();
  }

  /**
   * Event handler for facet selection changes
   */
  function search() {
    searchStats(true);
  }

  /**
   * Retrieve publication facets and optionally retrieve stats hits
   * 
   * @param retrieveHits Set to true to retrieve stats hits 
   * @param clearSearch Set to true to forecfully clear the current search
   */
  function searchStats(retrieveHits, clearSearch) {
    
    // Gather search params
    var isFiltered = false;
    var params = {};
    var paramNames = ['startDate', 'endDate', 'brand', 'issue', 'target'];
    for (paramName of paramNames) {
      var value = $('#' + paramName).val();
      if (value) {
        isFiltered = true;
        params[paramName] = value;
      }
    }

    // Size 0 will ensure only facets are returned (which is relevant when we don't have any filter selected)
    params.size = isFiltered ? MAX_STATS_RESULT_COUNT : 0;

    // Query stats API
    callStatsApi({
      type: 'GET',
      url: BASE_URL + '/statsSearch',
      data: params,
      success: (response) => {
        if (retrieveHits) {
          showHitsInClients(response.hits, clearSearch || !isFiltered);
        }
        showFacets(response.facets);
      }
    });
  }

  /**
   * Gathers unique asset id's in the given statsHits and shows 
   * these assets in the web client content pane.
   * 
   * @param hits Stats hits to show
   * @param clearSearch No filter selected, clear the search
   */
  function showHitsInClients(statsHits, clearSearch) {
    if (clearSearch) {
      elvisContext.openSearch('');
      $('#totalStats').html();
      return;
    }
    $('#totalStats').html('Publish count: ' + statsHits.length);  
    if (statsHits.length == 0) {
      // TODO: Not a really nice way to say we didn't find anything...
      elvisContext.openSearch('assetId:"nothingfound"');
      return;
    }
    
    var uniqueAssetIds = [];
    var i=0;
    while (uniqueAssetIds.length < MAX_ASSET_COUNT && i < statsHits.length) {
      if (uniqueAssetIds.indexOf(statsHits[i].assetId) == -1) {
        uniqueAssetIds.push(statsHits[i].assetId);
      }
      i++;
    }
    var query = 'id:' + uniqueAssetIds.join(' OR id:');
    elvisContext.openSearch(query);
  }

  /**
   * Display facets for brand, issue and target
   * 
   * @param facets All stats facets
   */
  function showFacets(facets) {
    var selectedBrandIdx = fillSelect('brand', facets.brand);
    fillSelect('issue', selectedBrandIdx > -1 ? facets.issue : []);
    fillSelect('target', selectedBrandIdx > -1 ? facets.target : []);
  }

  /**
   * Create facet options in SELECT
   * 
   * @param name Name of the SELECT element
   * @param facetFields Array of facetField objects
   */
  function fillSelect(name, facetFields) {
    var options = '<option></option>\n';
    var selectedIdx = -1;
    for (var i=0; i<facetFields.length; i++) {
      var facetField = facetFields[i];
      var facet = facetField[name] ? facetField[name] : facetField;
      options += '<option value="' + escapeHtml(facet.name) + '"';
      if (facet.name === selectedFilterValues[name]) {
        selectedIdx = i;
        options += ' selected';
      }
      options += '>' + escapeHtml(facet.name) + ' (' + facet.count + ')</option>';
    }
    $('#' + name).html(options);
    return selectedIdx;
  }

  /**
   * Selection change handler that acts when the asset selection changes
   */
  function selectionUpdated() {
    if (!elvisContext || !parent) {
      // Plugin is no longer active
      return;
    }
    selectedHits = elvisContext.activeTab.originalAssetSelection;
    renderDetailPanel();
    showCorrectPanel();
  }

  /**
   * Show stats details for the currently seledted panel
   */
  function renderDetailPanel() {
    if (selectedHits.length !== 1) {
      $('#publishedIn').html('<div class="#invalidSelection">Select one file</div>');
      return;
    }
    
    callStatsApi({
      type: 'GET',
      url: BASE_URL + '/stats/' + selectedHits[0].id,
      success: (response) => {
        var html = response.map((hit) => {
          return '<div class="statRecord">'
            + renderFieldValue('Publication date', hit.published)
            + renderFieldValue('Brand', hit.brand)
            + renderFieldValue('Target', hit.target)
            + renderFieldValue('Issue', hit.issue)
            + '</div>';
        }).join('');
        $('.publishedIn').html(html);
      }
    });
  }

  function callStatsApi(params) {
    params.contentType = 'application/json; charset=utf-8';
    params.dataType = 'json';
    params.error = (jqXHR, textStatus, error) => {
      console.log('API request failed: ' + JSON.stringify(jqXHR));
    };
    $.ajax(params);
  }

  /**
   * Render a single stats field-value pair
   */
  function renderFieldValue(field, value) {
    if (!value) {
      return '';
    }
    return '<div class="statField"><span class="statFieldLabel">' + escapeHtml(field) + ':</span> <span class="statFieldValue">' + escapeHtml(value) + '</span></div>';
  }

  function showCorrectPanel(forceOpenSearchPanel) {
    if (forceOpenSearchPanel || selectedHits.length == 0) {
      hide('.detailPanel');
      show('.searchPanel');
    }
    else {
      hide('.searchPanel');
      show('.detailPanel');
    }
  }

  function show(className) {
    $(className).css('display', 'flex');
  }

  function hide(className) {
    $(className).css('display', 'none');
  }

  /**
   * Initialize everything after DOM loaded
   */
  $(function () {
    elvisContext = ElvisPlugin.resolveElvisContext();
    elvisContext.updateCallback = selectionUpdated;
    elvisApi = new ElvisAPI("${serverUrl}");

    initDateFields();

    // Add event handlers for inputs, when an input changes, perform a search
    $('#startDate').change(search);
    $('#endDate').change(search);
    $('#brand').change(() => {
      selectedFilterValues['brand'] = $('#brand').val();
      selectedFilterValues['issue'] = '';
      selectedFilterValues['target'] = '';
      search();
    });
    $('#issue').change(() => {
      selectedFilterValues['issue'] = $('#issue').val();
      search();
    });
    $('#target').change(() => {
      selectedFilterValues['target'] = $('#target').val();
      search();
    });
    $('.backToSearch').click(() => {
      showCorrectPanel(true);
    });
    $('#resetLink').click(() => {
      selectedFilterValues = [];
      searchStats(true, true);
    });

    selectionUpdated();
    searchStats(false);
  });
})();