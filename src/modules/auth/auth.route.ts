import { Router } from 'express';
import { authControllers } from './auth.controller';
import { Role } from '../../../generated/prisma/enums';
import auth from '../../middleware/auth';


const router = Router();

router.post('/login', authControllers.login);

router.post('/refresh-token', authControllers.refreshToken);

router.patch(
  '/change-password',
  auth(
    Role.STUDENT,
    Role.MENTOR
  ),
  authControllers.changePassword,
);

router.patch('/forgot-password', authControllers.forgotPassword);
router.patch('/reset-password', authControllers.resetPassword);

export const authRoutes = router;
