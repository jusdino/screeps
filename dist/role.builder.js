'use strict';

var targeter = require('targeter');

module.exports = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.anchorId == null) {
            if (creep.memory.claim != null && creep.memory.claim.roomName != creep.room.name) {
                const flag = Game.flags[creep.memory.claim.flagName];
                console.log(creep.name + ' moving to flag: ' + flag.name);
                creep.moveTo(flag, {visualizePathStyle: {stroke: '#ffff00'}});
                return;
            } else {
                // Assign creep to an anchor
                targeter.assignRoundRobinAnchorTarget(
                    creep, FIND_MY_STRUCTURES, (structure) => (
                        structure.structureType == STRUCTURE_SPAWN
                    )
                )
            }
        }

        if(creep.store[RESOURCE_ENERGY] == 0) {
            if (creep.memory.building) {
                creep.say('⛽ charge');
            }
            creep.memory.building = false;
        } else if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if(creep.memory.building) {
            if (creep.memory.claim != null && creep.room.name != creep.memory.claim.roomName) {
                // If we're claiming a new room, special short-circuit:
                // Once they're full of energy, book it to a new room and get busy
                creep.say('NEW ROOM!!');
                creep.moveTo(Game.rooms[creep.memory.claim.roomName].controller, {visualizePathStyle: {stroke: '#ffff00'}});
                return;
            }
            var target = targeter.findBuildTarget(creep);
            if(target != null) {
                if(creep.build(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                target = targeter.findRepairTarget(creep);
                if (target != null) {
                    if(creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                } else {
                    creep.say('Going home');
                    target = Game.getObjectById(creep.memory.anchorId);
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        } else {
            let container = targeter.findEnergyWithdrawTarget(creep);
            if(container != null) {
                if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if (creep.harvest(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
    }
};
