import { SearchResponse } from 'elasticsearch';
import { Request, Response } from 'express';

import { Api } from './api';

export class PublishStats extends Api {

  public addRoute(): void {
    this.router.get('/publish/stats', (req: Request, res: Response) => {

      let params: any = req.query;
      let size: number = this.getSizeParam(req.query.size, 50, 950);

      /**
       * action - CUSTOM_ACTION_PUBLISH
       * brand - Magazine A, Newspaper B, Book C, ...
       * issue - January 2018, Q2, Week 23, ...
       * target - Web, Print, App, Facebook, Instagram, Twitter, ...
       * publicationDate - 2018-02-24, 2018-10-14 14:30:58
       */

      let allQueryParams: any[] = [];
      let brandParams: any[] = [];
      let issueParams: any[] = [];
      let targetParams: any[] = [];

      this.addTermQuery([allQueryParams, brandParams, issueParams, targetParams], 'action', 'CUSTOM_ACTION_PUBLISH');
      this.addTermQuery([allQueryParams, issueParams, targetParams], 'details.brand', params.brand);
      this.addTermQuery([allQueryParams, brandParams, targetParams], 'details.issue', params.issue);
      this.addTermQuery([allQueryParams, brandParams, issueParams], 'details.target', params.target);
      this.addDateRangeQuery([allQueryParams, brandParams, issueParams, targetParams], 'details.publicationDate', params.startDate, params.endDate);

      if (allQueryParams.length == 0) {
        res.status(500).send('No (valid) parameters specified');
        return;
      }

      let uniqueAssetCount:any = {
        cardinality: {
          field: 'assetId'
        }
      }

      let query = {
        index: 'stats',
        type: 'StatsUsage',
        body: {
          query: {
            bool: {
              must: allQueryParams
            }
          },
          size: size,
          aggregations: {
            allStats: {
              global: {},
              aggregations: {
                brands: {
                  filter: this.getFilter(brandParams),
                  aggregations: {
                    filteredBrands: {
                      terms: {
                        field: 'details.brand',
                        order: {
                          _term: 'asc'
                        }
                      },
                      aggregations: {
                        uniqueAssetCount: uniqueAssetCount,
                        issues: {
                          filter: this.getFilter(issueParams),
                          aggregations: {
                            filteredIssues: {
                              terms: {
                                field: 'details.issue',
                                order: {
                                  pub_dates: 'desc'
                                }
                              },
                              aggregations: {
                                uniqueAssetCount: uniqueAssetCount,
                                pub_dates: {
                                  min: {
                                    field: 'publicationDate'
                                  }
                                }
                              }
                            }
                          }
                        },
                        targets: {
                          filter: this.getFilter(targetParams),
                          aggregations: {
                            filteredTargets: {
                              terms: {
                                field: 'details.target',
                                order: {
                                  _term: 'asc'
                                }
                              },
                              aggregations: {
                                uniqueAssetCount: uniqueAssetCount
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      // console.log(JSON.stringify(query, null, 2));

      this.client.search(query).then((sr: SearchResponse<{}>) => {
        let response = {
          hits: [],
          facets: []
        };
        if (sr.hits && sr.hits.hits && sr.hits.hits.length > 0) {
          response.hits = sr.hits.hits.map((rawHit) => {
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
        if (sr.aggregations && sr.aggregations.allStats.brands.filteredBrands) {
          response.facets = sr.aggregations.allStats.brands.filteredBrands.buckets.map((brandBucket) => {
            let brandFacet = {
              brand: this.getFacet(brandBucket),
              issue: [],
              target: []
            };
            if (brandBucket.issues) {
              brandFacet.issue = brandBucket.issues.filteredIssues.buckets.map(this.getFacet);
            }
            if (brandBucket.targets) {
              brandFacet.target = brandBucket.targets.filteredTargets.buckets.map(this.getFacet);
            }
            return brandFacet;
          });
        }
        res.status(200).json(response);
      }).catch((error: any) => {
        this.handleElasticError(error, res);
      });
    });
  }

  private getFacet(bucket): any {
    return {
      name: bucket.key,
      count: bucket.uniqueAssetCount.value
    }
  }

  private addDateRangeQuery(queryParamArrays: any[], fieldName: string, startDate: string, endDate: string): void {
    let rangeQuery: any = this.getRangeQuery(fieldName, startDate, endDate);
    if (rangeQuery) {
      rangeQuery.range[fieldName].format = 'dd-MM-yyyy';
      queryParamArrays.forEach((queryParams) => {
        queryParams.push(rangeQuery);
      });
    }
  }

  private getRangeQuery(fieldName: string, startRange: any, endRange: any): any {
    if (!startRange && !endRange) {
      return null;
    }
    let rangeQuery: any = { range: {} };
    let rangeFieldQuery: any = rangeQuery.range[fieldName] = {};
    if (startRange) {
      rangeFieldQuery.gte = startRange;
    }
    if (endRange) {
      rangeFieldQuery.lte = endRange;
    }
    return rangeQuery;
  }

  private addTermQuery(queryParamArrays: any[], fieldName: string, fieldValue: String): void {
    if (!fieldValue) {
      return;
    }
    let termQuery: any = { term: {} };
    termQuery.term[fieldName] = fieldValue;
    queryParamArrays.forEach((queryParams) => {
      queryParams.push(termQuery);
    });
  }

  private getFilter(queryParams: any[]): any {
    if (queryParams.length == 0) {
      return {
        match_all: {}
      };
    }
    return {
      bool: {
        must: queryParams
      }
    };
  }

}