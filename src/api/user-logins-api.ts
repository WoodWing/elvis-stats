import { SearchResponse } from 'elasticsearch';
import { Request, Response } from 'express';

import { Api } from './api';

/**
 * Get Elvis user logins over a period of time
 * 
 * Endpoint:
 * ../userLogins
 * 
 * Query parameters:
 * @startDate (string): Stats start date in dd/mm/yyyy format
 * @endDate (string): Stats end date in dd/mm/yyyy format
 * @interval (string): Interval period, valid values are "year", "month", "week" and "day"
 * 
 * Example:
 * ../userLogins?startDate=01-01-2017&endDate=31-12-2017&interval=month
 * 
 * Response:
 * [{
 *   "period": "18 December 2018",
 *   "uniqueUserLogins": 1,
 *   "userLogins": [
 *       {
 *           "userName": "woodwing",
 *           "logins": 2
 *       }
 *   ]
 * },
 * {
 *   "period": "17 December 2018",
 *   "uniqueUserLogins": 2,
 *   "userLogins": [
 *       {
 *           "userName": "admin",
 *           "logins": 33
 *       },
 *       {
 *           "userName": "woodwing",
 *           "logins": 2
 *       }
 *   ]
 * }]
 * 
 */

export class UserLoginsApi extends Api {

  public addRoute(): void {
    this.router.get('/user-logins', (req: Request, res: Response) => {

      let startDate: string = req.query.startDate ? req.query.startDate : 'now-4w/w';
      let endDate: string = req.query.endDate ? req.query.endDate : 'now';
      let interval: string = req.query.interval ? req.query.interval : 'day';
      let intervalFormat: string = this.getIntervalFormat(interval);

      let query = {
        index: 'stats',
        type: 'StatsActivity',
        body: {
          query: {
            bool: {
              must: [
                {
                  term: {
                    activityType: {
                      value: 'LOGIN'
                    }
                  }
                },
                {
                  range: {
                    logDate: {
                      gte: startDate,
                      lte: endDate,
                      format: 'dd-MM-yyyy'
                    }
                  }
                }
              ]
            }
          },
          size: 0,
          aggregations: {
            logins: {
              date_histogram: {
                field: 'logDate',
                interval: interval,
                format: intervalFormat,
                order: {
                  loginDates: 'desc'
                }
              },
              aggregations: {
                loginDates: {
                  min: {
                    field: 'logDate'
                  }
                },
                uniqueLogins: {
                  cardinality: {
                    field: 'userName'
                  }
                },
                userLogins: {
                  terms: {
                    field: 'userName'
                  }
                }
              }
            }
          }
        }
      }

      this.client.search(query).then((sr: SearchResponse<{}>) => {
        let response = sr.aggregations.logins.buckets.map((loginBucket: any) => {
          let userLogins: any = loginBucket.userLogins.buckets.map((userLogin: any) => {
            return {
              userName: userLogin.key,
              logins: userLogin.doc_count
            }
          });
          return {
            period: loginBucket.key_as_string,
            uniqueUserLogins: loginBucket.uniqueLogins.value,
            userLogins: userLogins
          }
        });
        res.status(200).json(response);
      }).catch((error: any) => {
        this.handleElasticError(error, res);
      });
    });
  }

  private getIntervalFormat(interval): string {
    switch (interval) {
      case 'year':
        return 'yyyy';
      case 'month':
        return 'MMMM yyyy';
      case 'week':
        return '\'Week\' w yyyy';
      case 'day':
        return 'd MMMM yyyy';
      default:
        throw new Error('Invalid interval: ' + interval);
    }
  }
}