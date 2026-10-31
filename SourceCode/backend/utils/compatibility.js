// Blood compatibility: which DONOR groups can give to a given RECIPIENT group.
const ALL_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Red-cell compatibility (Whole Blood, Packed RBCs, Platelets use this simplified rule).
const RED_CELL = {
    'O-':  ['O-'],
    'O+':  ['O+', 'O-'],
    'A-':  ['A-', 'O-'],
    'A+':  ['A+', 'A-', 'O+', 'O-'],
    'B-':  ['B-', 'O-'],
    'B+':  ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ALL_GROUPS
};

// Plasma works the opposite way (ABO only, Rh ignored): AB is the universal plasma donor.
const PLASMA_ABO = { O: ['O', 'A', 'B', 'AB'], A: ['A', 'AB'], B: ['B', 'AB'], AB: ['AB'] };
const abo = (g) => g.replace(/[+-]/, '');

function donorGroupsFor(recipientGroup, component) {
    if (component === 'Plasma') {
        const allowed = PLASMA_ABO[abo(recipientGroup)] || [];
        return ALL_GROUPS.filter((g) => allowed.includes(abo(g)));
    }
    return RED_CELL[recipientGroup] || [];
}

module.exports = { donorGroupsFor, ALL_GROUPS };
