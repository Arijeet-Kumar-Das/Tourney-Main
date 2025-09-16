import express from 'express';
const router = express.Router();


import { signUp, verifyEmailWithOTP, login, checkPlayerAuthorization, getCurrentPlayer, logOut, getAllPublicTournaments, getTournamentEvents, getTournamentById, getAllOrganizationsPublic, getTournamentsByOrganization, getEventFixtures, updateFixtureScore, searchFixtureByTeams, checkEmailsRegistered, sendForgotPassOTP, verifyForgotPassOTP, resetPassword, createGroupTeamPlayer, createIndividualTeamPlayer, getEventDetails, getTournamentPlayers } from '../../Controllers/Players/PlayerController.js';

import { userAuthMiddleware } from '../../Middlewares/jwtAuth.js';



router.post('/signup',signUp);
router.post('/verifyEmailWithOTP',verifyEmailWithOTP);
router.post('/login',login);
router.post('/logout', userAuthMiddleware,logOut);
router.get('/checkAuth',userAuthMiddleware,checkPlayerAuthorization);
router.get('/getPlayerDetails',userAuthMiddleware, getCurrentPlayer);

router.get('/tournaments/public', getAllPublicTournaments);
router.get('/tournaments/:id', getTournamentById);
router.get('/tournaments/:id/events', getTournamentEvents);
router.get('/tournaments/:id/players', getTournamentPlayers);



router.post('/send-forgotpassword-otp', sendForgotPassOTP);
router.post('/verify-forgotpassword-otp', verifyForgotPassOTP);
router.post('/reset-password', resetPassword);






// Public: Get all organizations (for player)
router.get('/organizations/public', getAllOrganizationsPublic);

// Public: Get tournaments by organization
router.get('/organizations/:id/tournaments', getTournamentsByOrganization);

// Public: Get event details by ID
router.get('/events/:id', getEventDetails);

// Public: Get fixtures for an event
router.get('/events/:id/fixtures', getEventFixtures);

// GET search fixture by team names
router.get('/fixtures/search', searchFixtureByTeams);

// PATCH: Update fixture score
router.patch('/fixtures/:fixtureId', updateFixtureScore);

// Public: Register group team for event (player)
router.post('/registerGroupTeam/:TournamentId/:eventId', createGroupTeamPlayer);
// Public: Register individual team for event (player)
router.post('/registerIndividualTeam/:TournamentId/:eventId', createIndividualTeamPlayer);

// POST: Check if emails are registered
router.post('/checkEmailsRegistered', checkEmailsRegistered);

export default router;