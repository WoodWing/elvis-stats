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
        brand: hit.details.brand,
        issue: hit.details.issue,
        edition: hit.details.edition,
        target: hit.details.target,
        publicationDate: hit.details.publicationDate
      }
    });
  }

}