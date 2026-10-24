import { Router } from 'express';
import { Role } from '../../../generated/prisma/enums';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { projectController } from './project.controller';
import { projectValidations } from './project.validation';

const router = Router();

router.post(
  '/',
  auth(Role.STUDENT),
  validateRequest(projectValidations.createProjectZodSchema),
  projectController.create,
);
router.get(
  '/mine',
  auth(Role.STUDENT, Role.MENTOR),
  projectController.getMine,
);
router.get(
  '/stats',
  auth(Role.MENTOR),
  projectController.getStats,
);
router.get(
  '/',
  auth(Role.MENTOR),
  validateRequest(projectValidations.getAllProjectsZodSchema),
  projectController.getAll,
);
router.patch(
  '/:id/review',
  auth(Role.MENTOR),
  validateRequest(projectValidations.reviewProjectZodSchema),
  projectController.review,
);

export const projectRoutes = router;
