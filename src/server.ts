/**
 * Start web server and entry point for API requests.
 */

require("console-stamp")(console, { pattern: "dd-mm-yyyy HH:MM:ss.l" });
import express = require('express');
import http = require('http');
import { Application } from 'express';
import bodyParser = require('body-parser');
import { Config } from './config';
import { ApiManager } from './api/api-manager'

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