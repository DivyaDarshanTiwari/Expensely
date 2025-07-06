const express = require("express");

const Router = express.Router();

const groupControllers = require("../controllers/group");

Router.post("/createGroup", groupControllers.createGroup);

Router.post("/addMember", groupControllers.addMemberToGroup);

Router.get("/getMembers/:groupId", groupControllers.getGroupMembers);

Router.get("/getGroups", groupControllers.getGroupsByUser);

Router.delete("/removeMember", groupControllers.removeMemberFromGroup);

module.exports = Router;
