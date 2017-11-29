import { Router, Response } from 'express';
import { Client } from 'elasticsearch';

export abstract class Api {

  constructor(public router:Router, public client:Client) {
  }

  public abstract addRoute() : void;

  protected handleElasticError(error:any, response:Response):void {
    response.status(500).send(error.message);
  }
}