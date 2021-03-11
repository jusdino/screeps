'use strict';

module.exports = {
    /*
    Until your spawner has resources to make some pretty beefy defenders, these
    creeps are essentially sacrificial lambs that will hopefully keep invaders away
    from your other creeps while your tower(s) kill off the invader. They will
    distribute evenly across any flags you set in the room until they see any hostiles,
    at which point they will seek them out and attempt to attack.
    */
    cleanMemory: function(creepName) {
        console.log("Cleaning up flag memory for " + creepName);
        for (const flagName in Memory.flags) {
            let flag = Memory.flags[flagName];
            if (flag.creeps != null) {
                let idx = flag.creeps.indexOf(creepName);
                if (idx !== -1) {
                    flag.creeps.splice(idx, 1);
                }
            }
        }
    },
    run: function(creep) {
        if (creep.memory.flagName == null) {
            // Assign creep to a flag
            let flags = creep.room.find(FIND_FLAGS);
            for (const flag of flags) {
                if (flag.memory.creeps == null) {
                    flag.memory.creeps = [];
                }
            }
            let minFlag = flags.reduce(function(res, flag) {
                return (flag.memory.creeps.length < res.memory.creeps.length) ? flag : res;
            });
            minFlag.memory.creeps.push(creep.name);
            creep.memory.flagName = minFlag.name;
            console.log(creep.name + " assigned to flag " + minFlag.name);
        }

        // Ony defend its designated room - so defenders won't attack everything enroute
        // to a far-flung room
        const flag = Game.flags[creep.memory.flagName];
        const room = flag.room;
        if (room != null && creep.room.name == flag.room.name) {
            // const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
            let nearestHostile = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
            // if (nearestHostile == null && hostiles.length > 0) {
            //     nearestHostile = hostiles[0];
            // }
            if (nearestHostile != null) {
                let res = creep.rangedAttack(nearestHostile);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(nearestHostile, {visualizePathStyle: {stroke: '#ff0000'}});
                }
            } else {
                let flag = Game.flags[creep.memory.flagName];
                creep.moveTo(flag, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            creep.moveTo(flag, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }
};
