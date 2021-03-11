'use strict';

module.exports = {
    /*
    Spawner is driven by in-memory configuration. When evaluating what to spawn,
    if anything, it will prioritize:
    1) anything in Memory.spawnQueue,
    2) any role with creep count below Memory.role.X.minimumCount, in order of
        Memory.roleNamesByPriority
    3) any role with creep count below Memory.role.X.desiredCount, in order of
        Memory.roleNamesByPriority

    If there is anything in the spawn queue, it will try to spawn that. If there
    is any role under its minimumCount, it will spawn a new creep with the body
    parts listed in Memory.role.X.bodyParts[1]. Lastly, if there is a role under
    its desiredCount, it will spawn a new creep with the body parts listed in
    Memory.role.X.bodyParts[0].
    */
    run: function(room) {
        // Copy spawn configs from Memory template as necessary
        if (room.memory.roles == null) {
            room.memory.roles = Memory.roles;
        }
        if (room.memory.spawnQueue == null) {
            room.memory.spawnQueue = Memory.spawnQueue;
        }
        if (room.memory.roleNamesByPriority == null) {
            room.memory.roleNamesByPriority = Memory.roleNamesByPriority;
        }
        // Check for creep in spawn queue
        let spawnCreep;
        let spawnLog;
        if (room.memory.spawnQueue.length > 0) {
            console.log(room.name + ' attempting to spawn from queue');
            const spawns = room.find(FIND_MY_SPAWNS);
            for (const spawn of spawns) {
                if (!spawn.spawning) {
                    console.log(spawn.name + ' attempting to spawn from queue');
                    // Spawn desired creep, if any
                    spawnCreep = room.memory.spawnQueue.shift();
                    if (spawnCreep != null) {
                        const res = spawn.spawnCreep(spawnCreep[0], spawnCreep[1]+Game.time, spawnCreep[2]);
                        console.log(spawn.name + ' spawn attempt result: ' + res);
                        if ( res == 0) {
                            console.log(room.name + " spawning creep from queue: " + spawnCreep[1]);
                            break;
                        }
                    }
                    room.memory.spawnQueue.unshift(spawnCreep);
                }
            }
        } else {
            // Check for role below minimum count
            var creepCounts = {};
            for (const roleName of room.memory.roleNamesByPriority) {
                const role = room.memory.roles[roleName];
                creepCounts[roleName] =  room.find(FIND_MY_CREEPS, {
                    filter: (creep) => (
                    creep.room.name == room.name &&
                    creep.memory.role == roleName
                )}).length
                // console.log(room.name + " - " + roleName + " - " + creepCounts[roleName] + " of Minimum: " + role.minimumCount + ", Desired: " + role.desiredCount);
                if (creepCounts[roleName] < role.minimumCount) {
                    spawnCreep = [role.bodyParts[1], roleName + Game.time, {"memory":{"role":roleName}}]
                    spawnLog = room.name + " spawning creep for minimum role: " + roleName;
                    break;
                }
            }
            if (spawnCreep == null) {
                // Check for role below desired count
                for (const roleName of room.memory.roleNamesByPriority) {
                    const role = room.memory.roles[roleName];
                    if (creepCounts[roleName] < role.desiredCount) {
                        spawnCreep = [role.bodyParts[0], roleName + Game.time, {"memory":{"role":roleName}}]
                        spawnLog = room.name + " spawning creep for desired role: " + roleName;
                        break;
                    }
                }
            }
        }
        const spawns = room.find(FIND_MY_SPAWNS);
        for (const spawn of spawns) {
            if (!spawn.spawning && spawnCreep != null) {
                // Spawn desired creep, if any
                if (spawn.spawnCreep( spawnCreep[0], spawnCreep[1], spawnCreep[2]) == OK) {
                    console.log(spawnLog);
                    break;
                }
            }
        }
        for (const spawn of spawns) {
            if (spawn.spawning) {
                const spawningCreep = Game.creeps[spawn.spawning.name];
                room.visual.text(
                    '🛠️' + spawningCreep.memory.role,
                    spawn.pos.x + 1,
                    spawn.pos.y,
                    {align: 'left', opacity: 0.8}
                );
            }
        }
    }
};
