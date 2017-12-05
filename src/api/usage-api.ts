import { SearchResponse } from 'elasticsearch';
import { Request, Response } from 'express';

import { Api } from './api';

/**
 * Get Elvis usage stats over a period of time
 * 
 * Endpoint:
 * ../usage
 * 
 * Query parameters:
 * @startDate (string): Stats start date in dd/mm/yyyy format
 * @endDate (string): Stats end date in dd/mm/yyyy format
 * @interval (string): Interval period, valid values are "year", "month", "week" and "day"
 * 
 * Example:
 * ../usage?startDate=01-01-2017&endDate=31-12-2017&interval=month
 * 
 * Response:
 * [{
 *      "period": "August 2017",
 *      "actions": [
 *          {
 *              "action": "METADATA_UPDATE",
 *              "count": 175
 *          },
 *          {
 *              "action": "CREATE",
 *              "count": 13
 *          }
 *      ]
 *  },
 *  {
 *      "period": "October 2017",
 *      "actions": [
 *          {
 *              "action": "METADATA_UPDATE",
 *               "count": 465
 *          },
 *          {
 *              "action": "CREATE_RELATION",
 *              "count": 83
 *          }
 *      ]
 *  }]
 */
export class UsageApi extends Api {

  public addRoute():void {
    this.router.get('/usage', (req:Request, res:Response) => {

      let startDate:string = req.query.startDate ? req.query.startDate : '01-01-2010';
      let endDate:string = req.query.endDate ? req.query.endDate : '01-01-2050';
      let interval:string = req.query.interval ? req.query.interval : 'month';
      let intervalFormat:string = this.getIntervalFormat(interval);
      
      let query = {
        index: 'stats',
        type: 'StatsUsage',
        body: {
          query: {
            range : {
              logDate : {
                gte : startDate,
                lte : endDate,
                format : 'dd-MM-yyyy'
              }
            }
          },
          size: 0, 
          aggregations : {
            actions : {
              date_histogram : {
                field : 'logDate',
                interval : interval,
                format : intervalFormat
              },
              aggregations : {
                usage : {
                  terms : {
                    field : 'action'
                  }
                }
              }
            }
          }
        }
      }

      this.client.search(query).then((sr:SearchResponse<{}>) => {
        let response = sr.aggregations.actions.buckets.map((actionBucket:any) => {
          let actions:any = actionBucket.usage.buckets.map((usage:any) => {
            return {
              action: usage.key,
              count: usage.doc_count
            }
          });
          return {
            period: actionBucket.key_as_string,
            actions: actions
          } 
        });
        res.status(200).json(response);
      }).catch((error:any) => {
        this.handleElasticError(error, res);
      });
    });
  }

  private getIntervalFormat(interval):string {
    switch(interval) {
      case 'year' : 
        return 'yyyy';
      case 'month' :
        return 'MMMM yyyy';
      case 'week' :
        return 'w yyyy';
      case 'day' :
        return 'd MMMM yyyy';
      default :
        throw new Error('Invalid interval: ' + interval);
    }
  }

}