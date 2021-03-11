'use strict';
var targeter = require('targeter');

module.exports = {
    /*
    Harvesters harvest energy from sources and dump it in containers that can hold energy.
    Harvesters operate in two behavior modes:

    1) free-range. When room.memory.roles.harvester.zones != true, harvesters will seek out the
    nearest available source to pull energy from. This tends to work well early game.

    2) zones. When room.memory.roles.harvester == true, harvesters will only harvest energy from
    their source or the nearest link to their source if the link is set to 'pull' mode.
    Harvesters will then fill structures starting nearest to the source. You can limit the
    range from the source that a harvester will go to fill a source by setting
    room.memory.roles.harvesters.zoneRange to a number.
    */
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.anchorId == null) {
            // Get intended room:
            let room;
            console.log(creep.name + ' creep memory: ' + JSON.stringify(creep.memory));
            if (creep.claim != null) {
                console.log(creep.name + ' claim room: ' + creep.memory.claim.roomName);
                room = Game.rooms[creep.memory.claim.roomName];
            } else {
                room = creep.room;
            }
            // Assign creep to a source
            console.log(creep.name + ' finding anchor in room: ' + room);
            targeter.assignRoundRobinAnchorTarget(
                creep, FIND_SOURCES, (source) => true, room
            )
        }

        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            if (!creep.memory.harvesting) {
                creep.say('🔄 harvest');
            }
            creep.memory.harvesting = true;
        } else if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            creep.say('store');
        }

        if(creep.memory.harvesting) {
            let source;
            if (creep.room.memory.roles.harvester.zones) {
                let link = targeter.findEnergyLinkWithdrawTarget(creep);
                if (link != null && creep.withdraw(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(link, {visualizePathStyle: {stroke: '#ffaa00'}});
                    return;
                }
                source = Game.getObjectById(creep.memory.anchorId);
            } else {
                source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            }
            const res = creep.harvest(source);
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            } else if (res == ERR_NOT_ENOUGH_RESOURCES && creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
                creep.memory.harvesting = false;
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        } else {
            if (creep.memory.claim != null && creep.room.name != creep.memory.claim.roomName) {
                // If we're claiming a new room, special short-circuit:
                // Once they're full of energy, book it to a new room and get busy
                creep.say('NEW ROOM!!');
                creep.moveTo(Game.rooms[creep.memory.claim.roomName].controller, {visualizePathStyle: {stroke: '#f    fff00'}});
                return;
            }
            creep.memory.harvesting = false;
            let target;
            if (creep.room.memory.roles.harvester.zones && creep.room.memory.roles.harvester.zoneRange != null) {
                target = targeter.findEnergyStoreTargetInRange(creep, creep.room.memory.roles.harvester.zoneRange);
            } else {
                target = targeter.findEnergyStoreTarget(creep);
            }
            if (target == null) {
                creep.say('Going home');
                target = Game.getObjectById(creep.memory.anchorId);
            }
            if (creep.transfer(target, RESOURCE_ENERGY) != OK) {
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
};
