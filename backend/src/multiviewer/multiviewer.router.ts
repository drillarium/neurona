import * as express from 'express';           // express
import { Request, Response } from "express";  // express 
import { logger } from "../logger"            // logger
import { MultiviewerApp } from './multiviewer.app';
import { IScene } from './scene';
import { LauncherApp } from '../launcher/launcher.app';

// app
const app = MultiviewerApp.getInstance();

// Launcher app
const launcherApp = LauncherApp.getInstance();

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
  const sceneID = parseInt(req?.params?.id);
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }

    const mergedSchemas = launcherApp.getSchemas(scene.launcherId, "input");
    res.status(200).send(mergedSchemas);  
  }
  catch(error: any) {        
    logger.error(`GET "/scene/:id/input/schema" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET SCENE schema for outputs
multiviewerRouter.get("/scene/:id/output/schema", async(req: Request, res: Response) => {
  const sceneID = parseInt(req?.params?.id);
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }
    
    const mergedSchemas = launcherApp.getSchemas(scene.launcherId, "output");
    res.status(200).send(mergedSchemas);  
  }
  catch(error: any) {        
    logger.error(`GET "/scene/:id/output/schema" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET avaialbe inputs for this launcher
multiviewerRouter.get("/scene/:id/input", async(req: Request, res: Response) => {
  const sceneID = parseInt(req?.params?.id);
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }

    const engines = await launcherApp.getEngines(scene.launcherId, "input");
    res.status(200).send(engines);    
  }
  catch(error: any) {
    logger.error(`GET "/scene/:id/input" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET avaialbe outupts for this launcher
multiviewerRouter.get("/scene/:id/output", async(req: Request, res: Response) => {
  const sceneID = parseInt(req?.params?.id);
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }

    const engines = await launcherApp.getEngines(scene.launcherId, "output");
    res.status(200).send(engines);
  }
  catch(error: any) {
    logger.error(`GET "/scene/:id/output" ${JSON.stringify(error)}`);
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
    const scene = await app.getSceneGUI(id);
    if(!scene) {
      throw Error("getScene() error");
    } 
    
    res.status(200).send(scene);
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

// MODIFY SCENE - ADD INPUT TO SCENE
multiviewerRouter.post("/input/:id", async(req: Request, res: Response) => {
  const scene = parseInt(req.params.id);
  const input = req.body;
  try {
    await app.addInput(scene, input);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/input/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - MODIFY INPUT SCENE
multiviewerRouter.put("/input/:id/:input_index", async(req: Request, res: Response) => {
  const scene = parseInt(req.params.id);
  const input_index = parseInt(req.params.input_index);
  const input = req.body;
  try {
    await app.updateInput(scene, input_index, input);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/input/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - REMOVE INPUT SCENE
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

// MODIFY SCENE - ADD OUTPUT TO SCENE
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

// MODIFY SCENE - MODIFY OUTPUT SCENE
multiviewerRouter.put("/output/:id/:output_index", async(req: Request, res: Response) => {
  const scene = parseInt(req.params.id);
  const output_index = parseInt(req.params.output_index);
  const output = req.body;
  try {
    await app.updateOutput(scene, output_index, output);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/output/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// MODIFY SCENE - REMOVE OUTPUT SCENE
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

// CREATE INPUT FROM LAUNCHER 
multiviewerRouter.post("/scene/:id/input/launcher", async(req: Request, res: Response) => {
  const sceneID = parseInt(req?.params?.id);
  const config = req.body;
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }

    const launcherId = scene.launcherId;
    const module = launcherApp.getAppModuleAppType(launcherId, "input", config.type);

    // add input aaplication
    const launcher = launcherApp.launcher(launcherId);
    if(!launcher) {
      throw Error("Launcher not found");
    }

    // case error thows an exception
    await launcher.addApp(module, config);

    // response
    res.status(201).send(config);
  }
  catch(error: any) {
    logger.error(`POST "/scene/:id/input/launcher" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// CREATE OUTPUT FROM LAUNCHER 
multiviewerRouter.post("/scene/:id/output/launcher", async(req: Request, res: Response) => {
  const sceneID = parseInt(req?.params?.id);
  const config = req.body;
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }

    const launcherId = scene.launcherId;
    const module = launcherApp.getAppModuleAppType(launcherId, "output", config.type);

    // add output aaplication
    const launcher = launcherApp.launcher(launcherId);
    if(!launcher) {
      throw Error("Launcher not found");
    }

    // case error thows an exception
    await launcher.addApp(module, config);

    // response
    res.status(200).send(config);
  }
  catch(error: any) {
    logger.error(`POST "/scene/:id/output/launcher" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// UPDATE INPUT FROM LAUNCHER 
multiviewerRouter.put("/scene/:id/input/launcher", async(req: Request, res: Response) => {
  const sceneID = parseInt(req?.params?.id);
  const config = req.body;
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }

    const launcherId = scene.launcherId;
    const module = launcherApp.getAppModuleAppType(launcherId, "input", config.type);

    // update input aaplication
    const launcher = launcherApp.launcher(launcherId);
    if(!launcher) {
      throw Error("Launcher not found");
    }

    // case error thows an exception
    await launcher.updateApp(module, config);

    // response
    res.status(200).send(config);
  }
  catch(error: any) {
    logger.error(`PUT "/scene/:id/input/launcher" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// UPDATE OUTPUT FROM LAUNCHER 
multiviewerRouter.put("/scene/:id/output/launcher", async(req: Request, res: Response) => {
  const sceneID = parseInt(req?.params?.id);
  const config = req.body;
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }

    const launcherId = scene.launcherId;
    const module = launcherApp.getAppModuleAppType(launcherId, "output", config.type);

    // update otput aaplication
    const launcher = launcherApp.launcher(launcherId);
    if(!launcher) {
      throw Error("Launcher not found");
    }

    // case error thows an exception
    await launcher.updateApp(module, config);

    // response
    res.status(200).send(config);
  }
  catch(error: any) {
    logger.error(`PUT "/scene/:id/output/launcher" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// REMOVE INPUT FROM LAUNCHER 
multiviewerRouter.delete("/scene/:id/input/:type/:input/launcher", async(req: Request, res: Response) => {
  const sceneID = parseInt(req?.params?.id);
  const type = req?.params?.type;
  const inputId = parseInt(req?.params?.input);
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }

    const launcherId = scene.launcherId;
    const module = launcherApp.getAppModuleAppType(launcherId, "input", type);

    // remove input aaplication
    const launcher = launcherApp.launcher(launcherId);
    if(!launcher) {
      throw Error("Launcher not found");
    }

    // case error thows an exception
    await launcher.deleteApp(module, inputId);

    // response
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`DELETE "/scene/:id/input/:type/:input/launcher" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// REMOVE OUTPUT FROM LAUNCHER 
multiviewerRouter.delete("/scene/:id/output/:type/:output/launcher", async(req: Request, res: Response) => {
  const sceneID = parseInt(req?.params?.id);
  const type = req?.params?.type;
  const outputId = parseInt(req?.params?.output);
  try {
    // launcherID from sceneID
    const scene: IScene | null = app.getScene(sceneID);
    if(!scene) {
      throw Error("getScene() error");
    }

    const launcherId = scene.launcherId;
    const module = launcherApp.getAppModuleAppType(launcherId, "output", type);

    // remove input aaplication
    const launcher = launcherApp.launcher(launcherId);
    if(!launcher) {
      throw Error("Launcher not found");
    }

    // case error thows an exception
    await launcher.deleteApp(module, outputId);

    // response
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`DELETE "/scene/:id/output/:type/:output/:launcher" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});