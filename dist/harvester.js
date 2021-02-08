var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
	    if(creep.store.getFreeCapacity() > 0) {
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
                                structure.store.getFreeCapacity(RESOURCE_ENERGY) >= 0;
                    }
            });
            if(targets.length > 0) {
                console.log(creep.store.getFreeCapacity());
                var cur = 0;
                var targ;
                for(var tar in targets) {
                    console.log(tar)
                    console.log(targets[tar])
                    if (targets[tar].store.getFreeCapacity() > cur) {
                        targ = targets[tar];
                        cur = tar.store.getFreeCapacity();
                    }
                }
                if (targ.store.getFreeCapacity() == 0) {
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
