import {Translations} from "./Translations";

import { describe, expect, it } from 'vitest'; 

/**
 * Unit tests for Translations.
 */

describe('#To JSON', () => {
    it('translates', () => {
        // Mock JSON
        const jsonValue = {
            get: () => {return "hello world"}
        } as unknown as diffusion.JSON;

        const value = Translations.get("To JSON")?.translate(jsonValue);
        expect(value).toEqual([['"hello world"']]);
    });
});

describe('#To column', () => {

    it('translates', () => {

        // Mock JSON
        const jsonValue = {
            get: () => {return {x: 1, y: {z: 2}}}
        } as unknown as diffusion.JSON;

        const value = Translations.get("To column")?.translate(jsonValue);
        expect(value).toEqual(
            [
                ['x', 1],
                ['y.z', 2]
            ]
        );
    });

});

describe('#To row', () => {

    it('translates', () => {

        // Mock JSON
        const jsonValue = {
            get: () => {return {x: 1, y: {z: 2}}}
        } as unknown as diffusion.JSON;

        const value = Translations.get("To row")?.translate(jsonValue);
        expect(value).toEqual(
            [
                ['x', 'y.z'],
                [1, 2]
            ]
        );
    });

});