export const join = (values: string[] | number[], separator: string): string => {
    if (!values) return "";

    let output = "";

    for (let i = 0; i < values.length; i++) {
        if (i === 0) output = values[i].toString();

        else output = output + separator + values[i].toString();
    }

    return output;
};

export const rn = (x?: number) => {
    const rn = '\r\n';
    if (!x) return rn;

    let output = "";
    for (let i = 0; i < x; i++) {
        output += rn;
    }

    return output;
};

export const distinct = (values: number[] | string[]) => {
    const output = [];

    values.forEach(x => {
        if (output.includes(x))
            return;

        output.push(x);
    });

    return output;
};