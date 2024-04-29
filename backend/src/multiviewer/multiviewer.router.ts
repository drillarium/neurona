import * as express from 'express';           // express
import { Request, Response } from "express";  // express 
import { logger } from "../logger"            // logger
import { MultiviewerApp } from './multiviewer.app';

// app
const app = MultiviewerApp.getInstance();

// router definition
export const multiviewerRouter = express.Router();

// GET
multiviewerRouter.get("/", async(req: Request, res: Response) => {
  try {
    
  }
  catch(error: any) {
    logger.error(`GET "/" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});
