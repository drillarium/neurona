import * as express from 'express';           // express
import { Request, Response } from "express";  // express 
import { logger } from "../logger"            // logger
import { AppDataBase } from '../db';
import { LauncherApp } from './launcher.app';

// db
const db = AppDataBase.getInstance();

// router definition
export const launcherRouter = express.Router();

// GET launchers
launcherRouter.get("/", async(req: Request, res: Response) => {
  try {
    const launchers = await db.loadLaunchers();
    if(!launchers) {
      throw Error("loadLaunchers() error");
    }
    if(launchers.length > 0) {
      res.status(200).send(launchers);
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

// POST launcher
launcherRouter.post("/", async(req: Request, res: Response) => {
  const newLauncher = req.body;
  try {
    const launcher = await db.addLauncher(newLauncher);
    res.status(201).send(launcher);
  }
  catch(error: any) {
    logger.error(`POST "/" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// PUT launcher
launcherRouter.put("/:id", async(req: Request, res: Response) => {
  var launcher = req.body;
  launcher.id = req?.params?.id;
  try {
    await db.updateLauncher(launcher);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// DELETE launcher
launcherRouter.delete("/:id", async(req: Request, res: Response) => {
  const id = req.params.id;
  try {
    await db.deleteLauncher(parseInt(id));
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`DELETE "/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET launcher status
launcherRouter.get("/:id/status", async(req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const launcherApp: LauncherApp = LauncherApp.getInstance();
    const status = launcherApp.status(id);
    res.status(200).send(status);
  }
  catch(error: any) {
    logger.error(`GET "/:id/status" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// GET launcher schema
launcherRouter.get("/:id/schema", async(req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const schemas = await db.launcherAppsSchema(Number(id));
    const obj = Object.fromEntries(schemas);
    res.status(200).send(obj);
  }
  catch(error: any) {
    logger.error(`GET "/:id/schema" "${error.message}"`);
    res.status(400).send(error.message);
  }
});

// 