import { Request, Response } from 'express';
import { SearchResponse } from 'elasticsearch';
import bytes = require('bytes');
import { Api } from './Api';

export class FolderSizeApi extends Api {

  public addRoute():void {
    this.router.get('/folder-stats', (req:Request, res:Response) => {
      if (!req.query.folderPath) {
        return res.status(422).send('Required parameter folderPath is missing');
      }

      let folderPath:string = req.query.folderPath.toLowerCase();
      if (!folderPath.startsWith('/')) {
        folderPath = '/' + folderPath;
      }
      if (folderPath.endsWith('/')) {
        folderPath = folderPath.substring(0, folderPath.length -1);
      }

      let num:number = Math.min(100, Number(req.query.num));
    
      this.client.search({
        index: 'asset',
        type: 'asset',
        body: {
          'query': {
             'terms': {
                'ancestorPaths': [
                  folderPath
                ]
             }
          },
          'size': 0,
          'aggregations': {
             'folders': {
                'terms': {
                   'field': 'ancestorPaths',
                   'include': '^' + this.escapeRegEx(folderPath) + '/[^/]+$',
                   'order': {
                      'folder_size': 'desc'
                   },
                   'size': num
                },
                'aggregations': {
                   'folder_size': {
                      'sum': {
                         'field': 'fileSize'
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