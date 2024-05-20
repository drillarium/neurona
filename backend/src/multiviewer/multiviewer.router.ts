import * as express from 'express';           // express
import { Request, Response } from "express";  // express 
import { logger } from "../logger"            // logger
import { MultiviewerApp } from './multiviewer.app';

// app
const app = MultiviewerApp.getInstance();

// router definition
export const multiviewerRouter = express.Router();

// GET SCENES
multiviewerRouter.get("/scene", async(req: Request, res: Response) => {
  try {
    const scenes = app.getScenes();
    if(scenes.length == 0) {
      res.status(204).send();
    } else {
      res.status(200).send(scenes);
    }
  }
  catch(error: any) {
    logger.error(`GET "/scene" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET SCENE
multiviewerRouter.get("/scene/:id", async(req: Request, res: Response) => {
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
    logger.error(`GET "/scene/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// ADD SCENE
multiviewerRouter.post("/scene", async(req: Request, res: Response) => {
  const layout = req.body;
  try {
    await app.addScene(layout);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/scene" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// REMOVE SCENE
multiviewerRouter.delete("/scene/:id", async(req: Request, res: Response) => {
  const id = req.params.id;
  try {
    await app.removeScene(id);
    res.status(200).send();    
  }
  catch(error: any) {
    logger.error(`DELETE  "/scene/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE
multiviewerRouter.put("/scene", async(req: Request, res: Response) => {
  const layout = req.body;
  try {
    await app.updateScene(layout);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/scene" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - ADD COMPONENT TO SCENE
multiviewerRouter.post("/component/:id", async(req: Request, res: Response) => {
  const scene = req.params.id;
  const component = req.body;
  try {
    await app.addComponent(scene, component);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/component/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - MODIFY COMPONENT SCENE
multiviewerRouter.put("/component/:id", async(req: Request, res: Response) => {
  const scene = req.params.id;
  const component = req.body;
  try {
    await app.updateComponent(scene, component);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/component/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - REMOVE COMPONENT SCENE
multiviewerRouter.delete("/component/:id/:component", async(req: Request, res: Response) => {
  const scene = req.params.id;
  const component = req.params.component;
  try {
    await app.removeComponent(scene, component);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`DELETE "/component/:id/:component" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - ADD DESTINATION TO SCENE
multiviewerRouter.post("/destination/:id", async(req: Request, res: Response) => {
  const scene = req.params.id;
  const destination = req.body;
  try {
    await app.addDestination(scene, destination);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/destination/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - MODIFY DESTINATION SCENE
multiviewerRouter.put("/destination/:id", async(req: Request, res: Response) => {
  const scene = req.params.id;
  const destination = req.body;
  try {
    await app.updateDestination(scene, destination);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/destination/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - REMOVE DESTINATION SCENE
multiviewerRouter.delete("/destination/:id/:destination", async(req: Request, res: Response) => {
  const scene = req.params.id;
  const destination = req.params.destination;
  try {
    await app.removeDestination(scene, destination);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`DELETE "/destination/:id/:destination" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET INPUTS FOR LAUNCHER 

// GET OUTPUTS FOR LAUNCHER