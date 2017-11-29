import { Router, Application } from 'express';
import { Client } from 'elasticsearch';
import { FolderSizeApi } from './folder-size-api';

export class ApiManager {

  private client:Client;
  private router: Router;

  constructor(public app:Application) {
    this.client = new Client({
      host: 'localhost:9200',
      log: 'trace'
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

    new FolderSizeApi(this.router, this.client).addRoute();

    // API logging
    this.router.use((req, res, next) => {
      // Keep the compiler happy
      res = res;
      console.info('API call received: ' + req.method + ' "' + req.originalUrl + '" with params: ' + JSON.stringify(req.params));
      next();
    });
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