'use strict';

module.exports = {
    cleanAnchorMemory: function(creepName, anchorId) {
        console.log("Cleaning up anchor memory for " + creepName);
        const anchor = Memory.anchors[anchorId];
        if (anchor != null && anchor.creeps != null) {
            const idx = anchor.creeps.indexOf(creepName);
            if (idx !== -1) {
                anchor.creeps.splice(idx, 1);
            }
        }
    },

    assignRoundRobinAnchorTarget(creep, findType, filterFunc, room=null) {
        console.log(creep.name + ' assigning anchor');
        if (room == null) {
            room = creep.room
            console.log(creep.name + " choosing creep's current room");
        }
        console.log(creep.name + '  room:' + room);
        // Assign creep an anchor object
        // Init anchors memory as needed
        if (Memory.anchors == null) {
            console.log("Initializing anchors memory");
            Memory.anchors = {};
        }
        // Find valid targets
        const targets = room.find(findType, {
            filter: filterFunc
        });
        if (targets.length > 0) {
            // Initialize anchor memory for targets
            for (const target of targets) {
                if (Memory.anchors[target.id] == null) {
                    Memory.anchors[target.id] = {'creeps': []}
                }
            }
            // Find least assigned anchor target
            const minTarget = targets.reduce((res, target) =>
                (Memory.anchors[target.id].creeps.length < Memory.anchors[res.id].creeps.length) ? target : res
            );
            // Assign creep to that target
            Memory.anchors[minTarget.id].creeps.push(creep.name);
            creep.memory.anchorId = minTarget.id;
            console.log(creep.name + " assigned to anchor " + minTarget);
            // One last memory management item
            for (const objId in Memory.anchors) {
                if (Game.getObjectById(objId) == null) {
                    console.log('Cleaning up anchor memory for obj:' + objId);
                    delete Memory.anchors[objId]
                }
            }
        }
    },

    findRepairTarget(creep) {
        var target;
        if (creep.room.memory.wallHitsGoal == null) {
            creep.room.memory.wallHitsGoal = Memory.wallHitsGoal;
        }
        const hitsBucketCount = 10;
        const hitsBucketSize = creep.room.memory.wallHitsGoal / hitsBucketCount;
        for (let i = 1; i <= hitsBucketCount; i++) {
            // Find nearest repair target by 10% hits buckets
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => (
                    (10*structure.hits/structure.hitsMax) < i &&
                    (structure.hits < i*hitsBucketSize)
                )
            })
            if (target != null) {
                break;
            }
        }
        return target;
    },

    findBuildTarget(creep) {
        return creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
            filter: (structure) => structure.room.name == creep.room.name
        });
    },

    findEnergyStoreTarget(creep) {
        let target;
        if (creep.room.memory.roles[creep.memory.role].distribute != false) {
            target = this.findEnergyDistributeTarget(creep);
            if (target != null) {
                return target
            }
        }
        return findTargetByPathByType(creep, FIND_STRUCTURES, [[STRUCTURE_STORAGE, STRUCTURE_CONTAINER]]);
    },

    findEnergyStoreTargetInRange(creep, range) {
        let target;
        let anchor = Game.getObjectById(creep.memory.anchorId);
        let inRange = anchor.pos.findInRange(FIND_STRUCTURES, range, {
            filter: (structure) => structure.store != null
        });
        if (creep.room.memory.roles[creep.memory.role].distribute != false) {
            target = creep.pos.findClosestByPath(inRange, {
                filter: (structure) => (
                    structure.structureType == STRUCTURE_TOWER &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 100
                )
            });
            if (target != null) {
                return target;
            }
        }
        target = findNearestLinkIfPush(creep, true);
        if (target != null) {
            return target;
        }
        if (creep.room.memory.roles[creep.memory.role].distribute != false) {
            return findTargetByPathByType(creep, inRange, [[STRUCTURE_SPAWN, STRUCTURE_EXTENSION], [STRUCTURE_STORAGE, STRUCTURE_CONTAINER]]);
        } else {
            target = findTargetByPathByType(creep, inRange, [[STRUCTURE_STORAGE, STRUCTURE_CONTAINER]]);
            return target;
        }
    },

    findEnergyLinkWithdrawTarget(creep) {
        return findNearestLinkIfPush(creep, false);
    },

    findEnergyWithdrawTarget(creep) {
        let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => (
                (
                    structure.structureType == STRUCTURE_LINK ||
                    structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE
                ) &&
                structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
            )
        });
        return container;
    },

    findEnergyDistributeTarget(creep) {
        let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (structure) => (
                structure.structureType == STRUCTURE_TOWER &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > structure.store.getUsedCapacity(RESOURCE_ENERGY) &&
                structure.room.name == creep.room.name
            )
        });
        if (target != null) {
            return target;
        }
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => (
                structure.structureType == STRUCTURE_TOWER &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 100 &&
                structure.room.name == creep.room.name
            )
        });
        if (target != null) {
            return target;
        }
        return findTargetByPathByType(creep, FIND_MY_STRUCTURES, [[STRUCTURE_SPAWN, STRUCTURE_EXTENSION]]);
    },
}

var findTargetByPathByType = function(creep, search, structureTypeGroups) {
    let target;
    for (const structureTypes of structureTypeGroups) {
        target = creep.pos.findClosestByPath(search, {
            filter: (structure) => (
                structureTypes.includes(structure.structureType) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            )
        });
        if (target != null) {
            return target;
        }
    }
}

var findNearestLinkIfPush = function(creep, push) {
    // Only look at the nearest link to their anchor, check if it has capacity and is a push link
    const anchor = Game.getObjectById(creep.memory.anchorId);
    if (creep.memory.anchorId != null) {
        let inRange;
        if (Memory.rooms[creep.room.name].roles[creep.memory.role].zones == true && Memory.rooms[creep.room.name].roles[creep.memory.role].zoneRange != null) {
            inRange = anchor.pos.findInRange(FIND_STRUCTURES, Memory.rooms[creep.room.name].roles[creep.memory.role].zoneRange, {
                filter: (structure) => structure.structureType == STRUCTURE_LINK
            });
        } else {
            inRange = FIND_MY_STRUCTURES;
        }
        let target = anchor.pos.findClosestByRange(inRange, {
            filter: (structure) => (
                structure.structureType == STRUCTURE_LINK && 
                structure.room.name == creep.room.name
            )
        });
        if (target != null) {
            if (push) {
                if (Memory.structures[target.id].push && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    return target;
                }
            } else {
                if (!Memory.structures[target.id].push && target.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    return target;
                }
            }
        }
    }
}
