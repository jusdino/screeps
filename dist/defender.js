module.exports = {
    cleanMemory: function(creepName) {
        console.log("Cleaning up flag memory for " + creepName);
        for (let flagName in Memory.flags) {
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
            console.log(creep.name + " choosing a flag");
            // Assign creep to a flag
            let flags = creep.room.find(FIND_FLAGS);
            for (let flag of flags) {
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

        let nearestHostile = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        if (nearestHostile != null) {
            console.log(creep.name + " attacking " + nearestHostile.name);
            let res = creep.rangedAttack(nearestHostile);
            console.log(creep.name + " result: " + res);
            if (res == ERR_NOT_IN_RANGE) {
                console.log(creep.name + " moving closer to " + nearestHostile.name);
                creep.moveTo(nearestHostile, {visualizePathStyle: {stroke: '#ff0000'}});
            }
        } else {
            let flag = Game.flags[creep.memory.flagName];
            console.log(creep.name + " returning to " + flag.name);
            creep.moveTo(flag, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }
};