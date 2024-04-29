import * as express from 'express';           // express
import { Request, Response } from "express";  // express 
import { logger } from "../logger"            // logger
import { AppDataBase } from '../db';

// db
const db = AppDataBase.getInstance();

// router definition
export const userRouter = express.Router();

// GET users
userRouter.get("/", async(req: Request, res: Response) => {
  try {
    const users = await db.loadUsers();
    if(!users) {
      throw Error("loadUsers() error");
    }
    if(users.length > 0) {
      res.status(200).send(users);
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

// GET user by email
userRouter.get("/:email", async(req: Request, res: Response) => {
  try {
    const email = req?.params?.email;
    const user = await db.getUserByEmail(email);
    if(!user) {
      throw new Error(`User ${email} not found`);
    }
    res.status(200).send(user);
  }
  catch(error: any) {
    logger.error(`GET "/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// POST user
userRouter.post("/", async(req: Request, res: Response) => {
  const newUser = req.body;
  try {
    await db.saveUser(newUser);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`POST "/" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// POST user
userRouter.post("/validate", async(req: Request, res: Response) => {
  const user = req.body;
  try {
    const isValidUser = await db.validateUser(user.email, user.password);
    if(isValidUser) {
      res.status(200).send();
    }
    else {
      throw new Error(`User ${user.email} not found or invalid password`);
    }
  }
  catch(error: any) {
    logger.error(`POST "/" ${user} ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// PUT user
userRouter.put("/", async(req: Request, res: Response) => {
  const user = req.body;
  try {
    await db.updateUser(user);
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`PUT "/:id" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// DELETE user
userRouter.delete("/:id", async(req: Request, res: Response) => {
  const id = req?.params?.id;
  try {
    await db.deleteUser(parseInt(id));
    res.status(200).send();
  }
  catch(error: any) {
    logger.error(`DELETE "/:appuid" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});
