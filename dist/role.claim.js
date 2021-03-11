'use strict';

module.exports = {
    run(creep) {
        if (creep.room.memory.claim == null) {
            creep.room.memory.claim = {roomName: null};
        }
        if (creep.room.memory.claim.roomName != null && creep.memory.roomName == null) {
            creep.memory.roomName = creep.room.memory.claim.roomName;
            console.log(creep.name + ' taking on claim for room: ' + creep.memory.roomName);
        }
        if (creep.memory.roomName != null) {
            console.log(creep.name + ' claim found for room: ' + creep.memory.roomName);
            const room = Game.rooms[creep.memory.roomName];
            if (room != null) {
                const controller = Game.rooms[creep.memory.roomName].controller;
                let res = -1;
                if (!controller.my) {
                    res = creep.claimController(controller);
                    console.log(creep.name + ' claim attempt result: ' + res);
                    const signRes = creep.signController(controller, '\\o/ I did a thing!');
                    console.log(creep.name + ' trying to sign controller: ' + res);
                }
                if (res != OK) {
                    console.log(creep.name + ' moving to ' + controller);
                    creep.moveTo(controller, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                if (creep.memory.flagName != null) {
                    const flag = Game.flags[creep.memory.flagName];
                    console.log(creep.name + ' moving to flag: ' + creep.memory.flagName);
                    creep.moveTo(flag, {visualizePathStyle: {stroke: '#ffaa00'}});
                } else {
                    console.log(creep.name + ' waiting to find room: ' + creep.memory.roomName);
                }
            }
        } else {
            console.log(creep.name + ' what claim? I see no claim: ' + creep.memory.roomName);
        }
    }
};
