import * as express from 'express';           // express
import { Request, Response } from "express";  // express 
import { logger } from "../logger"            // logger
import { AppController } from './app.controller';

// singleton
const appController = AppController.getInstance();

// router definition
export const appsRouter = express.Router();

// GET apps
appsRouter.get("/", async(req: Request, res: Response) => {
  try {
    var apps = appController.availablaApps();
    if(!apps) {
      throw Error("availablaApps() error");
    }
    if(apps.length > 0) {
      res.status(200).send(apps);
    }
    else {
      res.status(204).send();
    }
  }
  catch(error: any) {
    logger.error(`GET "/" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET all applications
appsRouter.get("/all", async(req: Request, res: Response) => {
  try {
    var apps = appController.apps;
    if(!apps) {            
      throw Error("applications() error");
    }
    if(apps.length > 0) {
      res.status(200).send(apps);
    }
    else {
      res.status(204).send();
    }
  }
  catch(error: any) {
    logger.error(`GET "/all" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET app status
appsRouter.get("/status/:appuid", async(req: Request, res: Response) => {
  const appuid = req?.params?.appuid;
  try {
    const { result, error } = appController.status(appuid);
    if(!result) {
      throw new Error(error);
    }
    res.status(200).send(result);
  }
  catch(error: any) {
    logger.error(`GET "/status/:appuid" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET app configuration
appsRouter.get("/config/:appuid", async(req: Request, res: Response) => {
    const appuid = req?.params?.appuid;
    try {
      const { result, error } = appController.configuration(appuid);
      if(!result) {
        throw new Error(error);
      }
      res.status(200).send(result);
  }
  catch(error: any) {
    logger.error(`GET "/:appuid/config" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});


// GET app schema (generates the schema. Operation could be slow)
appsRouter.get("/schema/:appid", async(req: Request, res: Response) => {
  const appid = req?.params?.appid;
  try {
    const response : any = await appController.schema(appid);
    const { result, error } = response;
    if(!result) {
      throw new Error(error);
    }
    res.status(200).send(result);
  }
  catch(error: any) {
    logger.error(`GET "/:appid/schema" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// PUT app
appsRouter.put("/:appid", async(req: Request, res: Response) => {
  const appid = req?.params?.appid;
  const newConfig = req.body;
  try {
    const { result, error } = appController.updateConfiguration(appid, newConfig);
    if(!result) {
      throw new Error(error);
    }
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/:appuid" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// delete app
appsRouter.delete("/:appuid", async(req: Request, res: Response) => {
  const appuid = req?.params?.appuid;
  try {
    const { result, error } = appController.deleteApplication(appuid);
    if(!result) {
      throw new Error(error);
    }
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`DELETE "/:appuid" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// POST app
appsRouter.post("/:appid", async(req: Request, res: Response) => {
  const appid = req?.params?.appid;
  const newConfig = req.body;
  try {
    const { result, error } = appController.createConfiguration(appid, newConfig);
    if(!result) {
      throw new Error(error);
    }
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/:appid" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// PUT app command
appsRouter.put("/command/:command/:appuid", async(req: Request, res: Response) => {
  const command = req?.params?.command;
  const appuid = req?.params?.appuid;
  const params = req.body;
  try {
    const { result, error } = appController.runCommand(appuid, command, params);
    if(!result) {
      throw new Error(error);
    }
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/command/:command/:appuid" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});
