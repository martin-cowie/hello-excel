
/**
 * Remove the first occurence of a value from a list.
 * @param array 
 * @param elementToRemove 
 * @returns argument `array`
 */
export function removeElement<T>(array: T[], elementToRemove: T): T[] {
    const index = array.indexOf(elementToRemove); //TODO: consider more than identity comparison
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}

/**
 * Maps an enum invariant to it's key.
 * @param myEnum 
 * @param enumValue 
 * @returns the enum key, or null
 */
export function getEnumKeyByEnumValue<T extends Record<string, any>>(myEnum: T, enumValue: any): keyof T | null {
    const result = Object.keys(myEnum).find(x => myEnum[x] === enumValue);
    return result ? result as keyof T : null;
}

/**
 * Guard against falsey arguments. 
 * @param value 
 * @param name 
 * @returns `value` if it is truthy, or throws an Error
 */
export function requireNonFalsy(value: any, name: string): typeof value {
    if (!value) {
        throw new Error(`${name} cannot be falsy`);
    }
    return value
}

export type JsonValue = number | string | boolean | null | { [key: string]: JsonValue } | JsonValue[];

//FIXME: this is not full JSoNpath, nor JSoNPointer
export function getLeafPaths(data: JsonValue, prefix: string = ''): string[] {
    let paths: string[] = [];

    if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
            // Iterate through the array and recursively get paths
            data.forEach((item, index) => {
                paths = paths.concat(getLeafPaths(item, `${prefix}[${index}]`));
            });
        } else {
            // Iterate through each property of the object
            Object.entries(data).forEach(([key, value]) => {
                const currentPath = prefix.length > 0 ? `${prefix}.${key}` : key;
                paths = paths.concat(getLeafPaths(value, currentPath));
            });
        }
    } else {
        // Base case: it's a primitive, so just return the current path
        paths.push(prefix);
    }

    return paths;
}

export function findAllLeafPointers(obj: any) {
    const pointers: string[] = [];

    function traverse(current: any, path: string) {
        if (current !== null && typeof current === 'object' && !Array.isArray(current)) {
            // Traverse through each property if it's an object (not including arrays for simplicity)
            for (const key in current) {
                traverse(current[key], `${path}/${key}`);
            }
        } else {
            // It's a leaf node, so add the path to the pointers array
            pointers.push(path);
        }
    }

    traverse(obj, ""); // Start with an empty path for the root
    return pointers;
}


//FIXME: as above, should be either JSoNpath no JSoNPointer
export function extractValuesByPaths(data: JsonValue, paths: string[]): Map<string, JsonValue> {
    const resultMap = new Map<string, JsonValue>();

    paths.forEach(path => {
        const parts = path.split(/\.|\[|\].?/).filter(part => part !== '');
        let current: JsonValue = data;

        for (const part of parts) {
            if (current !== null && typeof current === 'object') {
                if (Array.isArray(current)) {
                    const index = parseInt(part, 10);
                    if (isNaN(index) || index < 0) {
                        throw new Error('Invalid path');
                    }
                    current = current[index];
                } else {
                    current = (current as { [key: string]: JsonValue })[part];
                }
            } else {
                throw new Error('Invalid path');
            }
        }
        resultMap.set(path, current);
    });

    return resultMap;
}

export function clip(cellValueMatrix: any[][], columns: number, rows: number): any[][] {

    if (columns < 1 || rows < 1) {
        throw new Error('illegal rows or columns value');
    }

    const matrixColumns = cellValueMatrix[0].length;
    const matrixRows = cellValueMatrix.length;

    if (matrixRows == rows && matrixColumns == columns) {
        return cellValueMatrix;
    }

    const emptyRow = Array(columns).fill(null);
    const result = Array(rows);
    for(let row=0; row< rows; row++) {
        result[row] = row < matrixRows ? 
            clipRow(cellValueMatrix[row], columns):
            emptyRow;
    }
    return result;
}

function clipRow<T>(row: T[], toLength: number): T[] {
    if (row.length == toLength) {
        return row;
    }
    else if (row.length > toLength) {
        return row.slice(0, toLength);
    }
    else {
        return row.concat(Array(toLength - row.length).fill(null));
    }
}

/**
 * Check that matrix is rectangular
 * @param matrix 
 * @returns true if all rows are the same length, and the number of rows is positive; false otherwise.
 */
export function isRectangular<T>(matrix: T[][]): boolean {

    if (!Array.isArray(matrix) || matrix.length < 1) {
        return false;
    }

    const rowLength = matrix[0].length;
    if (rowLength < 1) {
        return false;
    }

    for(const row of matrix) {
        if (!Array.isArray(row) || row.length != rowLength) {
            return false;
        }
    }

    return true;

}