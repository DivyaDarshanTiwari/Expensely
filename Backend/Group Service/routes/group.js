const express = require("express");

const Router = express.Router();

const groupControllers = require("../controllers/group");
const {
  requireAdmin,
  requireMember,
} = require("../middlewares/adminMiddleware");

Router.post("/createGroup", groupControllers.createGroup);

Router.post(
  "/addMember/:groupId",
  requireAdmin,
  groupControllers.addMemberToGroup
);

Router.get("/getMembers/:groupId", groupControllers.getGroupMembers);

Router.get("/getGroups", groupControllers.getGroupsByUser);

Router.post("/balances/:groupId", groupControllers.getUserGroupBalances);

Router.post("/settleUpWithUser/:groupId", groupControllers.settleUpWithUser);

Router.delete(
  "/removeMember/:groupId",
  requireAdmin,
  groupControllers.removeMemberFromGroup
);

Router.delete(
  "/deleteGroup/:groupId",
  requireAdmin,
  groupControllers.deleteGroup
);

Router.delete(
  "/leaveGroup/:groupId",
  requireMember,
  groupControllers.leaveGroup
);

// Admin management routes
Router.post("/makeAdmin/:groupId", requireAdmin, groupControllers.makeAdmin);
Router.post(
  "/removeAdmin/:groupId",
  requireAdmin,
  groupControllers.removeAdmin
);
Router.get("/getAdmins/:groupId", groupControllers.getGroupAdmins);

module.exports = Router;
