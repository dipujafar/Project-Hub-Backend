import { Router } from "express";
import { userController } from "./user.controller";
import validateRequest from "../../middleware/validateRequest";
import { userValidations } from "./user.validation";

const router = Router();

router.post(
  "/",
  validateRequest(userValidations.createUserZodSchema),
  userController.createUser,
);

export const userRoutes = router;
