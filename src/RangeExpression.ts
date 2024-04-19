export class RangeExpression {

    constructor(
        readonly start: string,
        readonly end?: string
    ) {
        /* do nothing more */
    }

    public static parse(rangeExpression: string): RangeExpression {
        const regex = /^([A-Z]*[0-9]*)(?::([A-Z]*[0-9]*))?$/i;
    
        const match = rangeExpression.match(regex);
        if (match) {
            const [, start, end] = match;
            if (start) {
                return { start, end };
            }
        }

        throw new Error("Cannot parse: " + rangeExpression);
    }

}