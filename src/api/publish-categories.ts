import { SearchResponse } from 'elasticsearch';
import { Request, Response } from 'express';

import { Api } from './api';

export class PublishCategories extends Api {

  public addRoute(): void {
    this.router.get('/publish/categories', (req: Request, res: Response) => {

      req = req;

      let query = {
        index: 'stats',
        type: 'StatsUsage',
        body: {
          size: 0,
          aggregations: {
            issuesPerBrand: {
              terms: {
                field: 'details.brand',
                order: {
                  _term: 'asc'
                }
              },
              aggregations: {
                issues: {
                  terms: {
                    field: 'details.issue',
                    order: {
                      pub_dates: 'desc'
                    }
                  },
                  aggregations: {
                    pub_dates: {
                      min: {
                        field: 'publicationDate'
                      }
                    }
                  }
                },
                targets: {
                  terms: {
                    field: 'details.target',
                    order: {
                      _term: 'asc'
                    }
                  }
                }
              }
            }
          }
        }
      };

      this.client.search(query).then((sr: SearchResponse<{}>) => {
        let categories: any[] = [];
        if (sr.aggregations && sr.aggregations.issuesPerBrand) {
          categories = sr.aggregations.issuesPerBrand.buckets.map((brandBucket) => {
            let category = {
              brand: brandBucket.key,
              issues: [],
              targets: []
            };
            if (brandBucket.issues) {
              category.issues = brandBucket.issues.buckets.map(issueBucket => issueBucket.key);
            }
            if (brandBucket.targets) {
              category.targets = brandBucket.targets.buckets.map(targetBucket => targetBucket.key);
            }
            return category;
          });
        }
        res.status(200).json(categories);
      }).catch((error: any) => {
        this.handleElasticError(error, res);
      });
    });
  }
}