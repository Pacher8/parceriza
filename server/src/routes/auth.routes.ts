import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/me', authenticate, authController.me);
