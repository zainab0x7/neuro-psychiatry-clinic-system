import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { createUserSchema } from '../utils/authValidation';

const router = Router();

// Apply authentication & Admin restriction to all user management routes
router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/', getUsers);
router.post('/', validateRequest(createUserSchema), createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
