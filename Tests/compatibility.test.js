// SCRUM-30: blood compatibility rules (pure unit test)
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { donorGroupsFor, ALL_GROUPS } = require(path.join(__dirname, '..', 'SourceCode', 'backend', 'utils', 'compatibility'));

const sorted = (a) => [...a].sort();

describe('SCRUM-30 blood compatibility', () => {
    it('O- can only receive O-', () => assert.deepEqual(donorGroupsFor('O-', 'Whole Blood'), ['O-']));
    it('AB+ can receive every group', () => assert.deepEqual(sorted(donorGroupsFor('AB+', 'Packed RBCs')), sorted(ALL_GROUPS)));
    it('A+ can receive A+, A-, O+, O-', () => assert.deepEqual(sorted(donorGroupsFor('A+', 'Whole Blood')), ['A+', 'A-', 'O+', 'O-']));
    it('B- can receive B- and O-', () => assert.deepEqual(sorted(donorGroupsFor('B-', 'Whole Blood')), ['B-', 'O-']));
    it('AB- can receive AB-, A-, B-, O-', () => assert.deepEqual(sorted(donorGroupsFor('AB-', 'Whole Blood')), ['A-', 'AB-', 'B-', 'O-']));
    it('plasma works the other way round: AB donors are universal', () => {
        assert.deepEqual(sorted(donorGroupsFor('AB+', 'Plasma')), ['AB+', 'AB-']);
        assert.ok(donorGroupsFor('O+', 'Plasma').includes('AB+'));
        assert.equal(donorGroupsFor('O+', 'Plasma').length, 8);
    });
    it('no compatible donor is ever returned for an unknown group', () => assert.deepEqual(donorGroupsFor('X+', 'Whole Blood'), []));
});
