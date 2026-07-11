
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
    getProfile, 
    updateProfile, 
    setPin, 
    requestRole, 
    getMyRoleApplications,
    changePassword, 
    updatePreferences, 
    generateReferral,
    requestResignation,
    getKordinatorDetails,
    promoteKordinator,
    dismissKordinator,
    checkCoordinatorArea
} from '../controllers/user.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/profile', getProfile as RequestHandler);
router.put('/profile', updateProfile as RequestHandler);
router.put('/pin', setPin as RequestHandler);
router.put('/password', changePassword as RequestHandler); 
router.put('/preferences', updatePreferences as RequestHandler); 
router.post('/referral', generateReferral as RequestHandler); 
router.post('/request-role', requestRole as RequestHandler);
router.get('/applications', getMyRoleApplications as RequestHandler); // NEW
router.post('/resignation', requestResignation as RequestHandler); // NEW
router.get('/kordinator-details', getKordinatorDetails as RequestHandler); // NEW
router.get('/check-coordinator-area', checkCoordinatorArea as RequestHandler); // NEW
router.post('/promote-kordinator', promoteKordinator as RequestHandler); // NEW
router.post('/dismiss-kordinator', dismissKordinator as RequestHandler); // NEW

export default router;
