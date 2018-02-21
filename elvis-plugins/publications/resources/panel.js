(function() {
  var elvisApi;
  var elvisContext;

  var selectedFilterValues = [];
  var selectedHits;
  
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
    // TODO: use selectedFilterValues instead (this is doing the work twice)
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
    params.size = isFiltered ? StatsUtil.MAX_STATS_RESULT_COUNT : 0;

    // Query stats API
    StatsUtil.callStatsApi({
      type: 'GET',
      url: StatsUtil.BASE_URL + '/statsSearch',
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
      showNotice('No search active');
      return;
    }
    if (statsHits.length == 0) {
      // TODO: Not a really nice way to say we didn't find anything...
      elvisContext.openSearch('assetId:"nothingfound"');
      showNotice('No published files found');
      return;
    }
    
    var uniqueAssetIds = [];
    var i=0;
    while (i < statsHits.length) {
      if (uniqueAssetIds.indexOf(statsHits[i].assetId) == -1) {
        uniqueAssetIds.push(statsHits[i].assetId);
      }
      i++;
    }

    if (uniqueAssetIds.length > StatsUtil.MAX_ASSET_COUNT) {
      showNotice(uniqueAssetIds.length + ' published files found, showing the top ' + StatsUtil.MAX_ASSET_COUNT + ' results.');
      uniqueAssetIds.splice(StatsUtil.MAX_ASSET_COUNT);
    }
    else {
      showNotice(uniqueAssetIds.length + ' published files found.');
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
   * Create facet options for SELECT elements
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
      options += '<option value="' + StatsUtil.escapeHtml(facet.name) + '"';
      if (facet.name === selectedFilterValues[name]) {
        selectedIdx = i;
        options += ' selected';
      }
      options += '>' + StatsUtil.escapeHtml(facet.name) + ' (' + facet.count + ')</option>';
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
   * Show stats details for the currently selected panel
   */
  function renderDetailPanel() {
    if (selectedHits.length !== 1) {
      $('#publishedIn').html('<div class="#invalidSelection">Select one file</div>');
      return;
    }
    
    StatsUtil.callStatsApi({
      type: 'GET',
      url: StatsUtil.BASE_URL + '/stats/' + selectedHits[0].id,
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

  /**
   * Render a single stats field-value pair
   */
  function renderFieldValue(field, value) {
    if (!value) {
      return '';
    }
    return '<div class="statField"><span class="statFieldLabel">' + StatsUtil.escapeHtml(field) + ':</span> <span class="statFieldValue">' + StatsUtil.escapeHtml(value) + '</span></div>';
  }

  function showNotice(message) {
    $('.noticeBlock').html(message);
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
    $('#startDate').change(() => {
      selectedFilterValues['startDate'] = $('#startDate').val();
      search();
    });
    $('#endDate').change(() => {
      selectedFilterValues['endDate'] = $('#endDate').val();
      search();
    });
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
      $('#startDate').val('');
      $('#endDate').val('');
      searchStats(true, true);
    });
    $('#reportLink').click(() => {
      var params = [];
      for(paramName in selectedFilterValues) { 
        params.push(paramName + '=' + encodeURIComponent(selectedFilterValues[paramName]));
      }
      var reportUrl = 'report.html?' + params.join('&');
      window.open(reportUrl, '_blank');
    })

    selectionUpdated();
    searchStats(false);
  });
})();