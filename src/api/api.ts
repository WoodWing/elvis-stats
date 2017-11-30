import { Client } from 'elasticsearch';
import { Request, Response, Router } from 'express';

export abstract class Api {

  protected static readonly DEFAULT_RESULT_SIZE:number = 10;
  protected static readonly MAX_RESULT_SIZE:number = 100;
  
  constructor(public router:Router, public client:Client) {
  }

  public abstract addRoute() : void;
  
  protected getSizeParam(size:string, defaultSize:number = Api.DEFAULT_RESULT_SIZE, maxSize:number = Api.MAX_RESULT_SIZE):number {
    let sizeNumber:number = Number(size);
    return isNaN(sizeNumber) ? defaultSize : Math.min(maxSize, sizeNumber);
  }

  protected checkRequiredParams(params:string[]) {
    return function(req:Request, res:Response, next:Function) {
      // Make sure each param listed in arr is present in req.query
      var missingParams:string[] = [];
      params.forEach(param => {
        if(!req.query[param]) {
          missingParams.push(param);
        }
      });
      if(missingParams.length == 0){
        next();
      } else {
        res.status(422).send("Missing required parameters: " + missingParams.join(","));
      }
    }
  }

  protected handleElasticError(error:any, response:Response):void {
    response.status(500).send(error.message);
  }
}