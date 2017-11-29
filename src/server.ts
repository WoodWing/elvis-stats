/**
 * Start web server and entry point for API requests.
 */
import bodyParser = require('body-parser');
import express = require('express');
import { Application } from 'express';
import http = require('http');

import { ApiManager } from './api/api-manager';
import { Config } from './config';


require("console-stamp")(console, { pattern: "dd-mm-yyyy HH:MM:ss.l" });
/**
 * Singleton server class
 */
class Server {

  private static instance: Server;

  public static getInstance(): Server {
    return this.instance || (this.instance = new this());
  }

  private app: Application;
  
  private constructor() {
    this.app = express();
    new ApiManager(this.app);
  }

  /**
   * Start the server
   */
  public start(): void {
    // Configure bodyParser
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
    this.app.use(express.static('public'));

    // Start HTTP server
    http.createServer(this.app).listen(Config.httpPort, () => {
      console.info('HTTP Server started at port: ' + Config.httpPort);
    });
  }
}

let server: Server = Server.getInstance();
server.start();