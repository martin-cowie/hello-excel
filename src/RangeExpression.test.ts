import {RangeExpression} from "./RangeExpression";
import { describe, expect, it } from 'vitest'; 

/**
 * Unit tests for RangeExpression.
 */

describe('#constructor', () => {
    it('constructs', () => {
        const re = new RangeExpression("A1", "B2");

        expect(re.start).toBe('A1');
        expect(re.end).toBe('B2');
    })

    it('constructs with missiong optional argument', () => {
        const re = new RangeExpression("A1");

        expect(re.start).toBe('A1');
        expect(re.end).toBeFalsy();
    })

});

describe('#parses valid expression', () => {
    it('parses range expression', () => {
        const re = RangeExpression.parse('A1:B2');

        expect(re.start).toBe('A1');
        expect(re.end).toBe('B2');
    });

    it('parses single cell coordinate', () => {
        const re = RangeExpression.parse('A1');

        expect(re.start).toBe('A1');
        expect(re.end).toBeFalsy();
    });

    it('handles invalid expression', () => {
        expect(() => RangeExpression.parse('__not a range expression')).toThrow('Cannot parse: __not a range expression');
    });

});