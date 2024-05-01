import {
    clip, removeElement, getEnumKeyByEnumValue, requireNonFalsy, 
    getLeafPaths, extractValuesByPaths
} from "./Common";

import { describe, expect, it } from 'vitest'; 

/**
 * Unit tests for Common.
 */

describe('#clip', () => {

    it ('handles illegal rows value', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(() => clip(matrix, 2, 0))
            .toThrow('illegal rows or columns value');
    });

    it('returns correctly sized rectangles untouched', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(clip(matrix, 2, 2)).toBe(matrix);
    });

    it ('clips excessive rows', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(clip(matrix, 2, 1)).toStrictEqual([[1, 2]]);
    });

    it ('clips excessive columns', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(clip(matrix, 1, 2)).toStrictEqual([[1], [3]]);
    });

    it ('clips excessive columns and rows', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(clip(matrix, 1, 1)).toStrictEqual([[1]]);
    });

    it ('adds padding columns', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(clip(matrix, 3, 2)).toStrictEqual([[1, 2, null], [3, 4, null]]);
    });

    it ('adds padding rows', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(clip(matrix, 2, 3)).toStrictEqual([[1, 2], [3, 4], [null, null]]);
    });

    it ('adds padding rows and removes columns8', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(clip(matrix, 1, 3)).toStrictEqual([[1], [3], [null]]);
    });
    
    it ('adds remove rows and adds columns', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(clip(matrix, 3, 1)).toStrictEqual([[1, 2, null]]);
    });


});

describe('#removeElement', () => {
    it('returns same haystack when needle is absent', () => {
        const list = [1, 2, 3, 4];
        expect(removeElement(list, 5)).toBe(list);
    });

    it('removes the needle when needle is at the head of the list', () => {
        const list = [1, 2, 3, 4];
        expect(removeElement(list, 1)).toStrictEqual([2, 3, 4]);
    });

    it('removes the needle when needle is at the tail of the list', () => {
        const list = [1, 2, 3, 4];
        expect(removeElement(list, 4)).toStrictEqual([1, 2, 3]);
    });

});

describe('#getEnumKeyByEnumValue', () => {

    enum SomeEnum {
        No = 0,
        Yes = "YES",
    };

    it('maps a value to its invariant', () => {
        expect(getEnumKeyByEnumValue(SomeEnum, "YES")).toEqual('Yes');
        expect(getEnumKeyByEnumValue(SomeEnum, 0)).toEqual('No');
    });

    it('maps a value to its invariant', () => {
        expect(getEnumKeyByEnumValue(SomeEnum, "kippers")).toBe(null);
    });

});

describe('#requireNonFalsy', () => {
    it('handles truthy values', ()=> {
        expect(requireNonFalsy(true, 'test argument')).toBe(true);
        expect(requireNonFalsy(1, 'test argument')).toBe(1);
    });

    it('handles falsy values', () => {
        expect(() => requireNonFalsy(false, 'test argument')).toThrow('test argument cannot be falsy')
        expect(() => requireNonFalsy(null, 'test argument')).toThrow('test argument cannot be falsy')
        expect(() => requireNonFalsy(undefined, 'test argument')).toThrow('test argument cannot be falsy')
        expect(() => requireNonFalsy(NaN, 'test argument')).toThrow('test argument cannot be falsy')
        expect(() => requireNonFalsy(0, 'test argument')).toThrow('test argument cannot be falsy')
        expect(() => requireNonFalsy("", 'test argument')).toThrow('test argument cannot be falsy')
    });
});

describe('#getLeafPaths', () => {

    it ('handles primitive values', () => {
        expect(getLeafPaths(42)).toEqual(['']);
        expect(getLeafPaths(true)).toEqual(['']);
        expect(getLeafPaths("hello")).toEqual(['']);
    })

    it('handles simplest object', () => {
        expect(getLeafPaths({x: 1})).toEqual(['x']);
    });

    it('handles nested objects', () => {
        expect(getLeafPaths({x: 1, y: {z: 1}})).toEqual(['x', 'y.z']);
    });

    it('handles simplest array', () => {
        expect(getLeafPaths([1, 2, 3])).toEqual(['[0]', '[1]', '[2]']);
    });

    it('handles nested array', () => {
        expect(getLeafPaths([1, [2, 3]])).toEqual(['[0]', '[1][0]', '[1][1]']);
    });

    it('handles objects nested within arrays', () => {
        expect(getLeafPaths([{x: 1}, {y: 1}])).toEqual(['[0].x', '[1].y']);
    });

});

describe('extractValuesByPaths', () => {

    it('extracts values from simple object', () => {
        expect(extractValuesByPaths({a: 1, b: 2}, ['a', 'b'])).toEqual(new Map([
            ['a', 1],
            ['b', 2]
        ]));
    });

    it('handles invalid paths', () => {
        expect(() => extractValuesByPaths({a: 1, b: [2]}, ['b.c'])).toThrow('Invalid path');
        expect(() => extractValuesByPaths({a: 1, b: [2]}, ['b[-1]'])).toThrow('Invalid path');
        expect(() => extractValuesByPaths({a: 1, b: [2]}, ['x.y.z'])).toThrow('Invalid path');
    });


    it('extracts values from nested object', () => {
        expect(extractValuesByPaths({a: 1, b: {x: 2}}, ['a', 'b.x'])).toEqual(new Map([
            ['a', 1],
            ['b.x', 2]
        ]));

        expect(extractValuesByPaths([1, {x: 2}], ['[0]', '[1].x'])).toEqual(new Map([
            ['[0]', 1],
            ['[1].x', 2]
        ]));

    });

    it('extracts values from simple array', () => {
        expect(extractValuesByPaths([1, 2, 3], ['[1]'])).toEqual(new Map([
            ['[1]', 2]
        ]));
    });

    it('extracts values from nested array', () => {
        expect(extractValuesByPaths([1, [2, 3]], ['[1][1]'])).toEqual(new Map([
            ['[1][1]', 3]
        ]));

        expect(extractValuesByPaths({a: 1, b: [2]}, ['b[0]'])).toEqual(new Map([
            ['b[0]', 2]
        ]));
    });

});