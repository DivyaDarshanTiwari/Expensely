const express = require("express");

const Router = express.Router();

const groupControllers = require("../controllers/group");

Router.post("/createGroup", groupControllers.createGroup);

Router.post("/addMember", groupControllers.addMemberToGroup);

Router.get("/getMembers/:groupId", groupControllers.getGroupMembers);

Router.get("/getGroups", groupControllers.getGroupsByUser);

Router.post("/balances/:groupId", groupControllers.getUserGroupBalances);

Router.post("/settleUpWithUser/:groupId", groupControllers.settleUpWithUser);

Router.delete("/removeMember", groupControllers.removeMemberFromGroup);

Router.delete("/deleteGroup", groupControllers.deleteGroup);

Router.delete("/leaveGroup", groupControllers.leaveGroup);

module.exports = Router;
