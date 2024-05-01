import * as express from 'express';           // express
import { Request, Response } from "express";  // express 
import { logger } from "../logger"            // logger
import { MultiviewerApp } from './multiviewer.app';

// app
const app = MultiviewerApp.getInstance();

// router definition
export const multiviewerRouter = express.Router();

// GET SCENES
multiviewerRouter.get("/", async(req: Request, res: Response) => {
  try {
    const scenes = app.getScenes();
    if(scenes.length == 0) {
      res.status(204).send();
    } else {
      res.status(200).send(scenes);
    }
  }
  catch(error: any) {
    logger.error(`GET "/" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET SCENE
multiviewerRouter.get("/:id", async(req: Request, res: Response) => {
  const id = req?.params?.id;
  try {
    const scene = app.getScene(id);
    if(!scene) {
      throw Error("getScene() error");
    } else {
      res.status(200).send(scene);
    }
  }
  catch(error: any) {
    logger.error(`GET "/" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// ADD SCENE
multiviewerRouter.post("/:id", async(req: Request, res: Response) => {
  const id = req?.params?.id;
  const layout = req.body;
  try {
    const success = app.addScene(id, layout);
    if(!success) {
      throw Error("addScene() error");
    } else {
      res.status(200).send();
    }
  }
  catch(error: any) {
    logger.error(`GET "/" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// REMOVE SCENE
multiviewerRouter.delete("/:id", async(req: Request, res: Response) => {
  const id = req?.params?.id;
  try {
    const success = app.removeScene(id);
    if(!success) {
      throw Error("removeScene() error");
    } else {
      res.status(200).send();
    }
  }
  catch(error: any) {
    logger.error(`GET "/" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - ADD COMPONENT TO SCENE

// MODIFY SCENE - MODIFY COMPONENT SCENE

// MODIFY SCENE - REMOVE COMPONENT SCENE

// MODIFY SCENE - ADD DESTINATION TO SCENE

// MODIFY SCENE - MODIFY DESTINATION SCENE

// MODIFY SCENE - REMOVE DESTINATION SCENE

// GET INPUTS FOR LAUNCHER 

// GET OUTPUTS FOR LAUNCHER