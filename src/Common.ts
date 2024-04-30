
export function removeElement<T>(array: T[], elementToRemove: T): T[] {
    const index = array.indexOf(elementToRemove); //TODO: consider more than identity comparison
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}

/**
 * Maps an enum invariant to it's key
 * @param myEnum 
 * @param enumValue 
 * @returns the enum key, or null
 */
export function getEnumKeyByEnumValue<T extends Record<string, any>>(myEnum: T, enumValue: any): keyof T | null {
    const result = Object.keys(myEnum).find(x => myEnum[x] === enumValue);
    return result ? result as keyof T : null;
}

export function requireNonFalsey(value: any, name: string): typeof value {
    if (value == null) {
        throw new Error(`${name} cannot be null or undefined`);
    }
    return value
}

export type JsonValue = number | string | boolean | null | { [key: string]: JsonValue } | JsonValue[];

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

export function extractValuesByPaths(data: JsonValue, paths: string[]): Map<string, JsonValue> {
    const resultMap = new Map<string, JsonValue>();

    paths.forEach(path => {
        const parts = path.split(/\.|\[|\].?/).filter(part => part !== '');
        let current: JsonValue = data;
        try {
            for (const part of parts) {
                if (current !== null && typeof current === 'object') {
                    if (Array.isArray(current)) {
                        const index = parseInt(part, 10);
                        current = current[index];
                    } else {
                        current = (current as { [key: string]: JsonValue })[part];
                    }
                } else {
                    throw new Error('Invalid path');
                }
            }
            resultMap.set(path, current);
        } catch (error: any) {
            console.error(`Error accessing path "${path}": ${error.message}`);
        }
    });

    return resultMap;
}
