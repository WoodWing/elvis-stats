import bytes = require('bytes');
import { SearchResponse } from 'elasticsearch';
import { Request, Response } from 'express';

import { Api } from './api';

export class FolderSizeApi extends Api {
  
  public addRoute():void {
    this.router.get('/folder-stats', this.checkRequiredParams(['folderPath']), (req:Request, res:Response) => {

      let folderPath:string = req.query.folderPath.toLowerCase();
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
      
      let size:number = this.getSizeParam(req.query.size);
    
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