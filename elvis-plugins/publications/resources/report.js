(function() {
  var elvisApi;
 
  function renderReport() {
    var params = {};
    var urlParams = new URLSearchParams(window.location.search);
    var searchHtml = '';
    for(var urlParam of urlParams) {
      params[urlParam[0]] = urlParam[1];
      searchHtml += renderFieldValue(urlParam[0], urlParam[1]);
    }
    params.size = StatsUtil.MAX_STATS_RESULT_COUNT;
    
    $('#searchParams').html(searchHtml);
    
    // Query stats API
    StatsUtil.callStatsApi({
      type: 'GET',
      url: StatsUtil.BASE_URL + '/statsSearch',
      data: params,
      success: (response) => {
        getHitDetails(response.hits);
      }
    });
  }

  function getHitDetails(statsHits) {
    var batchSize = 200;
    var statsHitsBatch = statsHits.length > batchSize ? statsHits.splice(0, batchSize) : statsHits;
    var query = 'id:' + statsHitsBatch.map((statsHit) => statsHit.assetId).join(' OR id:');
    elvisApi.search({
      q: query,
      metadataToReturn: 'filename',
      num: batchSize
    }, (data) => {
      var html = statsHitsBatch.map((statsHit) => {
        var hit = findHit(data.hits, statsHit.assetId);
        return '<div class="statsEntry">'
          + '<div class="thumb"><img src="' + hit.thumbnailUrl + '"></div>'
          + '<div class="details">'
          + renderFieldValue('Filename', hit.metadata.filename)
          + renderFieldValue('Published', statsHit.published)
          + renderFieldValue('Brand', statsHit.brand)
          + renderFieldValue('Target', statsHit.target)
          + renderFieldValue('Issue', statsHit.issue)
          + '</div></div>'
      }).join('');
      $('#stats').append(html);
      if (statsHits.length > batchSize) {
        getHitDetails(statsHits);
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
    if (value.length > 50) {
      value = value.substr(0, 50) + '...';
    } 
    return '<div class="statsField"><span class="statsFieldLabel">' + StatsUtil.escapeHtml(field) + ':</span> <span class="statsFieldValue">' + StatsUtil.escapeHtml(value) + '</span></div>';
  }

  function findHit(hits, assetId) {
    return hits.find((hit) => {
      return hit.id === assetId;
    })
  }

  /**
   * Initialize everything after DOM loaded
   */
  $(function () {
    elvisApi = new ElvisAPI("${serverUrl}");
    renderReport();
  });
})();