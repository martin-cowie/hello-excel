import {getLeafPaths, extractValuesByPaths} from "./Common.js";

interface Translation<T> {
    translate(input: T): any[][];
}

/**
 * Convert any JSON value to a single cell holding the JSON source.
 */
class ToJSONTranslation implements Translation<diffusion.JSON> {
    public translate(input: diffusion.JSON) {
        const result = JSON.stringify(input.get(), null, 2);
        return [[result]];
    }
}

class ColumnTranslation implements Translation<diffusion.JSON> {
    public translate(input: diffusion.JSON): any[][] {
        // Get the property names
        const value = input.get();
        const leafPaths = getLeafPaths(value);

        // Get the property for each name
        const valueMap = extractValuesByPaths(value, leafPaths);

        // Arrange two columns: property names, and property values
        let result: any[][] = leafPaths.map(leafPath => {
            return [leafPath, valueMap.get(leafPath)]
        });

        return result;
    }
}

class RowTranslation implements Translation<diffusion.JSON> {
    public translate(input: diffusion.JSON): any[][] {
        // Get the property names
        const value = input.get();
        const leafPaths = getLeafPaths(value);

        // Get the property for each name
        const valueMap = extractValuesByPaths(value, leafPaths);

        // Arrange two rows: property names, and property values
        let result: any[][] = [leafPaths, leafPaths.map(p => valueMap.get(p))];

        return result;
    }
}

export const Translations: Map<string, Translation<diffusion.JSON>> = new Map([
    ["To JSON", new ToJSONTranslation()],
    ["To column", new ColumnTranslation()],
    ["To row", new RowTranslation()]
]);
    

