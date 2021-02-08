var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
	    if(creep.store.getFreeCapacity() > 40) {
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[1], {visualizePathStyle: {stroke: '#ffaa00'}});
                creep.say('🔄 harvest');

            }
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_CONTAINER ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && 
                                (structure.store.getCapacity(RESOURCE_ENERGY) - structure.store[RESOURCE_ENERGY]) >= 0;
                    }
            });
            if(targets.length > 0) {
                var cur = 100;
                var targ;
                for(var tar in targets) {
                    var used = targets[tar].store[RESOURCE_ENERGY];
                    var cap = targets[tar].store.getCapacity(RESOURCE_ENERGY);
                    var free = used - cap;
                    if (free > cur) {
                        targ = targets[tar];
                        var used = targ.store[RESOURCE_ENERGY];
                        var cap = targ.store.getCapacity(RESOURCE_ENERGY);
                        cur = used - cap;
                    }
                }
                creep.say('transferring');
                if ((used - cap) == 0) {
                    creep.say('waiting');
                    creep.moveTo(Game.flags.Flag2, {visualizePathStyle: {stroke: '#ffffff'}});
                }
                else if(creep.transfer(targ, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE || (creep.store.getFreeCapacity() == 0)) {
                    creep.moveTo(targ, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
	}
};

module.exports = roleHarvester;
