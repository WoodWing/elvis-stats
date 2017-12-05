import { Client } from 'elasticsearch';
import { Application, Router } from 'express';

import { DuplicateApi } from './duplicate-api';
import { FolderSizeApi } from './folder-size-api';
import { UsageApi } from './usage-api';

export class ApiManager {

  private client:Client;
  private router: Router;

  constructor(public app:Application) {
    this.client = new Client({
      host: 'localhost:9200',
      log: 'info'
    });
    this.router = Router();
    // Prefix all API's with /api
    this.app.use('/api', this.router);
    this.addRoutes(); 
  }

  /**
   * Add API routes
   */
  private addRoutes(): void {
    
    // API Request logging
    this.router.use((req, res, next) => {
      // Keep the compiler happy
      res = res;
      console.info('API call received: ' + req.method + ' "' + req.originalUrl);
      next();
    });
 
    new FolderSizeApi(this.router, this.client).addRoute();
    new DuplicateApi(this.router, this.client).addRoute();
    new UsageApi(this.router, this.client).addRoute();
  }

  // private usageStats() {
  //   this.router.post('/usage-stats', (req:Request, res:Response) => {
  //     req=req;

  //     this.client.search({
  //       index: 'stats',
  //       type: 'StatsUsage',
  //       body: {
  //         'size': 0, 
  //         'aggregations' : {
  //           'action_date_range' : {
  //             'date_histogram' : {
  //               'field' : 'logDate',
  //               'interval' : 'month',
  //               'format' : 'MMMM yyyy'
  //             },
  //             'aggregations' : {
  //               'action_usage' : {
  //                 'terms' : {
  //                   'field' : 'action'
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }).then((sr:SearchResponse<{}>) => {
  //       res.status(200).json(sr);
  //     }).catch((error:any) => {
  //       res.status(500).send(error.message);
  //     });
  //   });
  // }
}