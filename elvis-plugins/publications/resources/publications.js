(function() {
  var elvisApi;
  var elvisContext;
  var selectedValues = [];
  var selectedHits;
  var MAX_ASSET_COUNT = 900;

  function selectionUpdated() {
    if (!elvisContext || !parent) {
      // Plugin is no longer active
      return;
    }
    selectedHits = elvisContext.activeTab.originalAssetSelection;
    populatePublishedInPanel();
    showCorrectPanel();
  }

  function populatePublishedInPanel() {
    if (selectedHits.length !== 1) {
      $('#publishedIn').html('<div class="#invalidSelection">Select one file</div>');
      return;
    }
    $.ajax({
      type: 'GET',
      url: '/plugins/stats_api/publish/stats/' + selectedHits[0].id,
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      success: function (response) {

        var html = response.map((hit) => {
          //TODO: cleanup
          var itemHtml = '<div class="statRecord">'
            + '<div class="statField"><span class="statFieldLabel">Publication date:</span> <span class="statFieldValue">' + hit.published + '</span></div>'
            + '<div class="statField"><span class="statFieldLabel">Brand:</span> <span class="statFieldValue">' + hit.brand + '</span></div>';
          if (hit.target) {
            itemHtml += '<div class="statField"><span class="statFieldLabel">Target:</span> <span class="statFieldValue">' + hit.target + '</span></div>';
          }
          if (hit.issue) {
            itemHtml += '<div class="statField"><span class="statFieldLabel">Issue:</span> <span class="statFieldValue">' + hit.issue + '</span></div>';
          }
          itemHtml += '</div>';
          return itemHtml;
        }).join('');
        $('.publishedIn').html(html);
      },
      error: function (jqXHR, textStatus, error) {
        console.log('API request failed: ' + JSON.stringify(jqXHR));
      }
    });
  }

  function populateSearchFields() {
    $.datepicker.setDefaults({
      dateFormat: 'dd-mm-yy',
      dayNamesMin: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      firstDay: 1,
      showAnim: 'fadeIn'
    });

    $('#startDate').datepicker();
    $('#endDate').datepicker();
  }

  function search() {
    loadCategories(true);
  }

  function loadCategories(searchAssets) {
    var containsQuery = false;
    var params = {};
    var paramNames = ['startDate', 'endDate', 'brand', 'issue', 'target'];
    for (paramName of paramNames) {
      var value = $('#' + paramName).val();
      if (value) {
        containsQuery = true;
        params[paramName] = value;
      }
    }

    params.size = containsQuery ? 10000 : 0;

    $.ajax({
      type: 'GET',
      url: '/plugins/stats_api/publish/statsSearch',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: params,
      success: function (response) {
        if (searchAssets) {
          executeSearch(response.hits, containsQuery);
        }
        showFacets(response.facets);
      },
      error: function (jqXHR, textStatus, error) {
        console.log('API request failed: ' + JSON.stringify(jqXHR));
      }
    });
  }

  function executeSearch(hits, containsQuery) {
    var query = '';
    if (containsQuery) {
      if (hits.length == 0) {
        hits[0] = { assetId: 'nothingfound' };
      }
      var uniqueAssetIds = [];
      var i=0;
      while (uniqueAssetIds.length < MAX_ASSET_COUNT && i < hits.length) {
        if (uniqueAssetIds.indexOf(hits[i].assetId) == -1) {
          uniqueAssetIds.push(hits[i].assetId);
        }
        i++;
      }
      console.log("Hit count: " + hits.length + "; Unique asset count: " + uniqueAssetIds.length);
      query = 'id:' + uniqueAssetIds.join(' OR id:');
    }
    // console.log('query = ' + query)
    elvisContext.openSearch(query);
  }

  function showFacets(facets) {
    var selectedBrandIdx = fillSelect('brand', facets.brand);
    fillSelect('issue', selectedBrandIdx > -1 ? facets.issue : []);
    fillSelect('target', selectedBrandIdx > -1 ? facets.target : []);
  }

  function fillSelect(name, facets) {
    var options = '<option></option>\n';
    var selectedIdx = -1;
    for (var i=0; i<facets.length; i++) {
      var facetField = facets[i];
      var facet = facetField[name] ? facetField[name] : facetField;
      options += '<option value="' + facet.name + '"';
      if (facet.name === selectedValues[name]) {
        selectedIdx = i;
        options += ' selected';
      }
      options += '>' + facet.name + ' (&asymp;' + facet.count + ')</option>';
    }
    $('#' + name).html(options);
    return selectedIdx;
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

  $(function () {
    elvisContext = ElvisPlugin.resolveElvisContext();
    elvisApi = new ElvisAPI("${serverUrl}");

    $('#startDate').change(search);
    $('#endDate').change(search);
    $('#brand').change(function () {
      selectedValues['brand'] = $(this).val();
      selectedValues['issue'] = '';
      selectedValues['target'] = '';
      search();
    });
    $('#issue').change(function () {
      selectedValues['issue'] = $(this).val();
      search();
    });
    $('#target').change(function () {
      selectedValues['target'] = $(this).val();
      search();
    });
    $('.backToSearch').click(function () {
      showCorrectPanel(true);
    });

    elvisContext.updateCallback = selectionUpdated;
    selectionUpdated();
    populateSearchFields();
    loadCategories(false);
  });
})();