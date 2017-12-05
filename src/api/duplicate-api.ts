import { SearchResponse } from 'elasticsearch';
import { Request, Response } from 'express';

import { Api } from './api';

/**
 * Detect duplicate assets
 * 
 * Endpoint:
 * ../detect-duplicates
 * 
 * Query parameters:
 * @field (string): Field to perform duplicate detection on, valid values are: "filename", "fileSize" and "firstExtractedChecksum"
 * @size (number): Maximum number of results
 * 
 * Example:
 * ../detect-duplicates?field=filename&size=50
 * 
 * Response:
 * [{
 *      "fieldValue": "parade.jpg",
 *      "duplicates": 5
 *  },
 *  {
 *      "fieldValue": "louvre.jpg",
 *      "duplicates": 2
 *  }]
 */
export class DuplicateApi extends Api {

  private static readonly ALLOWED_FIELDS:string[] = ['filename', 'fileSize', 'firstExtractedChecksum'];
  private static readonly DEFAULT_FIELD:string = 'firstExtractedChecksum';

  public addRoute():void {
    this.router.get('/detect-duplicates', (req:Request, res:Response) => {
      let field:string = DuplicateApi.ALLOWED_FIELDS.includes(req.query.field) ? req.query.field : DuplicateApi.DEFAULT_FIELD;
      let size:number = this.getSizeParam(req.query.size);
      
      this.client.search({
        index: 'asset',
        type: 'asset',
        body: {
          'size': 0,
          'aggregations': {
             'duplicates': {
                'terms': {
                   'field': field,
                   'size': size,
                   'min_doc_count': 2
                }
             }
          }
        }
      }).then((sr:SearchResponse<{}>) => {
        let response = sr.aggregations.duplicates.buckets.map((duplicate:any) => {
          return {
            fieldValue: duplicate.key,
            duplicates: duplicate.doc_count,
          } 
        });
        res.status(200).json(response);
      }).catch((error:any) => {
        this.handleElasticError(error, res);
      });
    });
  }
}