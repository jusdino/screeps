'use strict';
var targeter = require('targeter');

module.exports = {
    /*
    */
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.anchorId == null) {
            // Get intended room:
            let room;
            if (creep.claim != null) {
                room = Game.rooms[creep.memory.claim.roomName];
                console.log(creep.name + ' requesting anchor from claim room:' + room);
            } else {
                room = creep.room;
                console.log(creep.name + ' requesting anchor from local room:' + room);
            }

            // Assign creep to a container or pull link
            targeter.assignRoundRobinAnchorTarget(
                creep,
                FIND_STRUCTURES,
                (structure) => (
                    structure.structureType == STRUCTURE_CONTAINER ||
                    (
                        structure.structureType == STRUCTURE_LINK &&
                        Memory.structures[structure.id].push == false
                    )

                ),
                room
            );
        }

        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            if (creep.memory.distributing) {
                creep.say('⛽ charge');
            }
            creep.memory.distributing = false;
        }
        if(!creep.memory.distributing && creep.store.getFreeCapacity() == 0) {
            creep.memory.distributing = true;
            creep.say('♲ distribute');
        }

        if(creep.memory.distributing) {
            if (creep.memory.claim != null && creep.room.name != creep.memory.claim.roomName) {
                // If we're claiming a new room, special short-circuit:
                // Once they're full of energy, book it to a new room and get busy
                creep.say('NEW ROOM!!');
                creep.moveTo(Game.rooms[creep.memory.claim.roomName].controller, {visualizePathStyle: {stroke: '#ffff00'}});
                return;
            }
            let target;
            target = targeter.findEnergyDistributeTarget(creep);
            if (target == null) {
                const targets = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => structure.structureType == STRUCTURE_STORAGE
                });
                if (targets.length > 0) {
                    target = targets[0];
                }
            }
            if (target != null) {
                if (creep.transfer(target, RESOURCE_ENERGY) != OK) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                creep.say('Going home');
                target = Game.getObjectById(creep.memory.anchorId);
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            // Prioritize pull link
            const link = targeter.findEnergyLinkWithdrawTarget(creep);
            if (link != null) {
                if (creep.withdraw(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(link, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
                return;
            }
            // Next prioritize anchor container/storage
            const anchor = Game.getObjectById(creep.memory.anchorId);
            // If anchor empty, find alternative
            let target = anchor.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => (
                    (
                        structure.structureType == STRUCTURE_CONTAINER
                    ) &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
                )
            });
            if (target == null) {
                target = anchor.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => (
                        (
                            structure.structureType == STRUCTURE_STORAGE
                        ) &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
                    )
                });
            }
            // Lastly, if no alternatives, just go to anchor anyway
            if (target == null) {
                creep.say('Going home');
                target = Game.getObjectById(creep.memory.anchorId);
            }
            if (creep.withdraw(target, RESOURCE_ENERGY) != OK) {
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
    }
};

