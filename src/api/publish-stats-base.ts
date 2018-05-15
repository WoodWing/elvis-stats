import { Api } from "./api";

export abstract class PublishStatsBase extends Api {

  protected getHitsResponse(hits) {
    if (!hits || !hits.hits || hits.hits.length == 0) {
      return [];
    }
    return hits.hits.map((rawHit) => {
      let hit: any = rawHit._source;
      return {
        assetId: hit.assetId,
        brand: hit.details.brand__s,
        issue: hit.details.issue__s,
        target: hit.details.target__s,
        published: hit.details.published__dt
      }
    });
  }

}