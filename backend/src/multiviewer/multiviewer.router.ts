import * as express from 'express';           // express
import { Request, Response } from "express";  // express 
import { logger } from "../logger"            // logger
import { MultiviewerApp } from './multiviewer.app';

// app
const app = MultiviewerApp.getInstance();

// router definition
export const multiviewerRouter = express.Router();

// GET SCENE schema
multiviewerRouter.get("/scene/schema", async(req: Request, res: Response) => {
  try {
    const schema = app.getSchema();
    res.status(200).send(schema);    
  }
  catch(error: any) {
    logger.error(`GET "/scene" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET SCENE schema for inputs
multiviewerRouter.get("/scene/:id/input/schema", async(req: Request, res: Response) => {
  const id = parseInt(req?.params?.id);
  try {
    res.status(400).send("");
    // const schema = [ {}, { }];
    // res.status(200).send(schema);    
  }
  catch(error: any) {
    logger.error(`GET "/scene/:id/input/schema" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET SCENE schema for outputs
multiviewerRouter.get("/scene/:id/output/schema", async(req: Request, res: Response) => {
  const id = parseInt(req?.params?.id);
  try {
    res.status(400).send("");
    // const schema = [ {}, { }];
    // res.status(200).send(schema);
  }
  catch(error: any) {
    logger.error(`GET "/scene/:id/output/schema" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET SCENES
multiviewerRouter.get("/scene", async(req: Request, res: Response) => {
  try {
    const scenes = await app.getScenesGUI();
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
  const id = parseInt(req?.params?.id);
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
  const scene = req.body;
  try {
    // scene from GUI or already with UIDs resolved
    var sceneWithId = {};
    if('launcher' in scene) {
      sceneWithId = await app.addSceneGUI(scene);
    }
    else {
      sceneWithId = await app.addScene(scene);
    }

    res.status(201).send(sceneWithId);
  }
  catch(error: any) {
    logger.error(`POST "/scene" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// REMOVE SCENE
multiviewerRouter.delete("/scene/:id", async(req: Request, res: Response) => {
  const id = parseInt(req.params.id);
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
multiviewerRouter.put("/scene/:id", async(req: Request, res: Response) => {
  var scene = req.body;
  scene.id = parseInt(req?.params?.id);
  try {
    await app.updateSceneGUI(scene);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/scene" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - ADD COMPONENT TO SCENE
multiviewerRouter.post("/input/:id", async(req: Request, res: Response) => {
  const scene = parseInt(req.params.id);
  const component = req.body;
  try {
    await app.addInput(scene, component);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/input/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - MODIFY COMPONENT SCENE
multiviewerRouter.put("/input/:id", async(req: Request, res: Response) => {
  const scene = parseInt(req.params.id);
  const component = req.body;
  try {
    await app.updateInput(scene, component);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/iput/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - REMOVE COMPONENT SCENE
multiviewerRouter.delete("/input/:id/:input", async(req: Request, res: Response) => {
  const scene = parseInt(req.params.id);
  const input = parseInt(req.params.input);
  try {
    await app.removeInput(scene, input);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`DELETE "/input/:id/:input" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - ADD DESTINATION TO SCENE
multiviewerRouter.post("/output/:id", async(req: Request, res: Response) => {
  const scene = parseInt(req.params.id);
  const output = req.body;
  try {
    await app.addOutput(scene, output);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/output/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - MODIFY DESTINATION SCENE
multiviewerRouter.put("/output/:id", async(req: Request, res: Response) => {
  const scene = parseInt(req.params.id);
  const output = req.body;
  try {
    await app.updateOutput(scene, output);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/output/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - REMOVE DESTINATION SCENE
multiviewerRouter.delete("/output/:id/:output", async(req: Request, res: Response) => {
  const scene = parseInt(req.params.id);
  const output = parseInt(req.params.output);
  try {
    await app.removeOutput(scene, output);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`DELETE "/output/:id/:destination" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET INPUTS FOR LAUNCHER 

// GET OUTPUTS FOR LAUNCHER