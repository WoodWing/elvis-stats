class StatsUtil {

  static get BASE_URL() {
    return '${serverUrl}/plugins/stats_api/publish';
  }

  static get MAX_STATS_RESULT_COUNT() {
    return 10000;
  }

  static get MAX_ASSET_COUNT() {
    return 900;
  }

  static get ENTITY_MAP() {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
  }

  static escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, (s) => {
      return ENTITY_MAP[s];
    });
  }

  static callStatsApi(params) {
    params.contentType = 'application/json; charset=utf-8';
    params.dataType = 'json';
    params.error = (jqXHR, textStatus, error) => {
      console.log('API request failed: ' + JSON.stringify(jqXHR));
    };
    $.ajax(params);
  }
}
