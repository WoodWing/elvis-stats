import { SearchResponse } from 'elasticsearch';
import { Request, Response } from 'express';

import { PublishStatsBase } from './publish-stats-base';

export class PublishStats extends PublishStatsBase {

  public addRoute(): void {
    this.router.get('/publish/stats/:assetId', (req: Request, res: Response) => {
      req = req;

      if (!req.params.assetId) {
        res.status(500).send('Invalid request, parameter "assetId" is required.');
        return;
      }

      let query = {
        index: 'stats',
        type: 'StatsUsage',
        body: {
          query: {
            bool: {
              must: [
                {
                  term: {
                    action: 'CUSTOM_ACTION_PUBLISH'
                  }
                },
                {
                  term: {
                    assetId: req.params.assetId
                  }
                }
              ]
            }
          },
          sort: {
            'details.publicationDate': {
              order: 'desc'
            }
          }
        }
      };
      // console.log(JSON.stringify(query, null, 2));

      this.client.search(query).then((sr: SearchResponse<{}>) => {
        let response = this.getHitsResponse(sr.hits);
        res.status(200).json(response);
      }).catch((error: any) => {
        this.handleElasticError(error, res);
      });
    });
  }
}