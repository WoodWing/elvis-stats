import bytes = require('bytes');
import { SearchResponse } from 'elasticsearch';
import { Request, Response } from 'express';

import { Api } from './api';

/**
 * Get (sub)-folder size statistics
 * 
 * Endpoint:
 * ../folder-stats
 * 
 * Query parameters:
 * @folderPath (string): Folder to get stats for
 * @size (number): Maximum number of results
 * 
 * Example:
 * ../folder-stats?folderPath=/demo%20zone&size=20
 * 
 * Response:
 * [{
 *      "name": "/demo zone/images",
 *      "size": 204464523,
 *      "sizeFormatted": "194.99MB"
 *  },
 *  {
 *      "name": "/demo zone/video",
 *      "size": 55335922,
 *      "sizeFormatted": "52.77MB"
 *  }]
 */
export class FolderSizeApi extends Api {
  
  public addRoute():void {
    this.router.get('/folder-stats', this.checkRequiredParams(['folderPath']), (req:Request, res:Response) => {

      let folderPath:string = (req.query.folderPath as string).toLowerCase();
      let query:any;
      let includeRegEx:string;
      
      if(folderPath === '/') {
        // Get info for root zone
        folderPath = '/';
        query = {
          match_all : {}
        };
        includeRegEx = '^/*/[^/]+$';
      }
      else {
        // Get info for sub folder
        if (!folderPath.startsWith('/')) {
          folderPath = '/' + folderPath;
        }
        if (folderPath.endsWith('/')) {
          folderPath = folderPath.substring(0, folderPath.length - 1);
        }
        query = {
          terms: {
            ancestorPaths: [
              folderPath
            ]
         }
        };
        includeRegEx = '^' + this.escapeRegEx(folderPath) + '/[^/]+$';
      }
      
    
      let size:number = this.getSizeParam(req.query.size as string);
      this.client.search({
        index: 'asset',
        type: 'asset',
        body: {
          query,
          size: 0,
          aggregations: {
             folders: {
                terms: {
                   field: 'ancestorPaths',
                   include: includeRegEx,
                   order: {
                      folder_size: 'desc'
                   },
                   size: size
                },
                aggregations: {
                   folder_size: {
                      sum: {
                         field: 'fileSize'
                      }
                   }
                }
             }
          }
       }
      }).then((sr:SearchResponse<{}>) => {
        let response = sr.aggregations.folders.buckets.map((folderBucket:any) => {
          return {
            name: folderBucket.key,
            size: folderBucket.folder_size.value,
            sizeFormatted: bytes(folderBucket.folder_size.value)
          } 
        });
        res.status(200).json(response);
      }).catch((error:any) => {
        this.handleElasticError(error, res);
      });
    });
  }

  private escapeRegEx(text:string):string {
    return text.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
  }

}