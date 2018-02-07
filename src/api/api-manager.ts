import { Client } from 'elasticsearch';
import { Application, Router } from 'express';

import { DuplicateApi } from './duplicate-api';
import { FolderSizeApi } from './folder-size-api';
import { UsageApi } from './usage-api';
import { PublishStats } from './publish-stats';
import { PublishStatsSearch } from './publish-stats-search';
import { PublishCategories } from './publish-categories';

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
    new PublishStats(this.router, this.client).addRoute();
    new PublishStatsSearch(this.router, this.client).addRoute();
    new PublishCategories(this.router, this.client).addRoute();
  }
}