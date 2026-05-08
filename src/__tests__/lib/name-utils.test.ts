import { cleanName, splitName, normalizeName, stripDiacritics } from '@/lib/name-utils';

describe('name-utils', () => {
  describe('cleanName', () => {
    it('removes parenthetical suffixes', () => {
      expect(cleanName('Shohei Ohtani (Batter)')).toBe('Shohei Ohtani');
      expect(cleanName('Shohei Ohtani (Pitcher)')).toBe('Shohei Ohtani');
    });

    it('handles names without suffixes', () => {
      expect(cleanName('Mike Trout')).toBe('Mike Trout');
    });
  });

  describe('splitName', () => {
    it('splits simple names', () => {
      expect(splitName('Mike Trout')).toEqual({ firstName: 'Mike', lastName: 'Trout' });
    });

    it('handles multi-word first names', () => {
      expect(splitName('Juan Carlos Oviedo')).toEqual({ firstName: 'Juan Carlos', lastName: 'Oviedo' });
    });

    it('handles single names', () => {
      expect(splitName('Prince')).toEqual({ firstName: 'Prince', lastName: '' });
    });
  });

  describe('stripDiacritics', () => {
    it('removes accents from characters', () => {
      expect(stripDiacritics('José')).toBe('Jose');
      expect(stripDiacritics('Ramírez')).toBe('Ramirez');
      expect(stripDiacritics('José Ramírez')).toBe('Jose Ramirez');
    });

    it('handles tildes', () => {
      expect(stripDiacritics('Señor')).toBe('Senor');
      expect(stripDiacritics('Núñez')).toBe('Nunez');
    });

    it('preserves non-accented characters', () => {
      expect(stripDiacritics('Aaron Judge')).toBe('Aaron Judge');
    });
  });

  describe('normalizeName', () => {
    it('lowercases names', () => {
      expect(normalizeName('Mike Trout')).toBe('mike trout');
    });

    it('removes suffixes', () => {
      expect(normalizeName('Ronald Acuña Jr.')).toBe('ronald acuna');
      expect(normalizeName('Ken Griffey Jr')).toBe('ken griffey');
      expect(normalizeName('Cal Ripken III')).toBe('cal ripken');
    });

    it('strips accents for matching', () => {
      expect(normalizeName('José Ramírez')).toBe('jose ramirez');
      expect(normalizeName('Ronald Acuña Jr.')).toBe('ronald acuna');
    });

    it('removes parenthetical suffixes', () => {
      expect(normalizeName('Shohei Ohtani (Batter)')).toBe('shohei ohtani');
    });

    it('handles combined normalization', () => {
      expect(normalizeName('José Ramírez Jr. (Batter)')).toBe('jose ramirez');
    });
  });
});
